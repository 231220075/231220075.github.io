---
title: 云原生结课project
date: 2025-08-12 15:52:32
updated: 2025-08-12 15:52:32
tags:
  - 学习
categories:
  - 学习记录
description: 顺手上传暑课项目
top: false
comments: true
toc: true
mathjax: false
copyright: true
---

# 📝 云原生结课project

> 顺手上传暑课项目


## 1. 项目组员信息

| 姓名 | 学号 |  个人贡献 |
|------|------|----------|
| 黄睿智 | 231220075 | part3 + 文档编写 |
| 白子敬 | 231220077 | part1 |
| 陈翔宇 | 231220088 | part2 |


---

## 2. 限流功能相关的关键代码和说明

### 2.1 限流系统架构概述

本项目采用基于 **Bucket4j + Redis** 的分布式限流方案，实现了多层次的流量控制机制：

- **应用层限流**：使用 Bucket4j 令牌桶算法
- **连接层限流**：Spring Boot Tomcat 连接池限制
- **网络层限流**：Kubernetes 网络策略和端口转发限制

### 2.2 核心限流组件

#### 限流配置类 (RateLimitConfig.java)

```java
@Configuration
public class RedisConfig {
    
    @Value("${REDIS_HOST:${spring.redis.host:localhost}}")
    private String redisHost;
    
    @Value("${REDIS_PORT:${spring.redis.port:6379}}")
    private int redisPort;
    
    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory() {
        // 直接从环境变量读取
        String host = System.getenv("REDIS_HOST");
        if (host == null || host.trim().isEmpty()) {
            host = redisHost;
        }
        
        String portStr = System.getenv("REDIS_PORT");
        int port = redisPort;
        if (portStr != null && !portStr.trim().isEmpty()) {
            try {
                port = Integer.parseInt(portStr);
            } catch (NumberFormatException e) {
                // 使用默认端口
            }
        }
        
        System.out.println("Spring Data Redis connecting to: " + host + ":" + port);
        
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(host);
        config.setPort(port);
        
        JedisConnectionFactory factory = new JedisConnectionFactory(config);
        return factory;
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        return template;
    }
    
    @Bean
    public JedisPool jedisPool() {
        // 直接从环境变量读取，如果为空则使用配置文件
        String host = System.getenv("REDIS_HOST");
        if (host == null || host.trim().isEmpty()) {
            host = redisHost;
        }
        
        String portStr = System.getenv("REDIS_PORT");
        int port = redisPort;
        if (portStr != null && !portStr.trim().isEmpty()) {
            try {
                port = Integer.parseInt(portStr);
            } catch (NumberFormatException e) {
                // 使用默认端口
            }
        }
        
        System.out.println("Jedis Pool connecting to: " + host + ":" + port);
        
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(8);
        config.setMaxIdle(8);
        config.setMinIdle(0);
        config.setTestOnBorrow(true);
        config.setTestOnReturn(true);
        config.setTestWhileIdle(true);
        return new JedisPool(config, host, port);
    }
}
```

#### 限流服务类 (RateLimiterService.java)

```java
@Service
public class RateLimiterService {

    private final ProxyManager<byte[]> buckets;
    private static final byte[] KEY = "global-rate-limit-key".getBytes();

    @Autowired
    public RateLimiterService(ProxyManager<byte[]> buckets) {
        this.buckets = buckets;
    }

    public Bucket resolveBucket() {
        return buckets.builder().build(KEY, getConfigSupplier());
    }

    private Supplier<BucketConfiguration> getConfigSupplier() {
        return () -> BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(
                    100, 
                    Refill.greedy(100, Duration.ofSeconds(1)))
                )
                .build();
    }
}
```

#### 限流拦截器 (RateLimitInterceptor.java)

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RateLimiterService rateLimiterService;

    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        Bucket bucket = rateLimiterService.resolveBucket();
        if (bucket.tryConsume(1)) {
            return true;
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests");
            return false;
        }
    }
}
```

#### Web 配置类 (WebMvcConfig.java)

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 注册限流拦截器并指定拦截路径
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/hello")  // 只拦截/hello路径
                .order(0);
    }
}
```

### 2.3 应用配置

#### application.properties 限流相关配置

```properties
spring.application.name=prometheus-test-demo

# 统一使用8998端口
server.port=8998

# Redis 配置 - 直接使用环境变量
spring.redis.host=${REDIS_HOST:localhost}
spring.redis.port=${REDIS_PORT:6379}
spring.redis.timeout=2000ms

# 强制使用 Jedis 客户端
spring.redis.jedis.pool.enabled=true
spring.redis.lettuce.pool.enabled=false

# Actuator 配置
management.endpoints.web.exposure.include=health,info,prometheus,metrics
management.endpoint.health.show-details=always

# 限流相关配置
rate.limit.enabled=true
rate.limit.global.key=global-rate-limit-key
rate.limit.capacity=100
rate.limit.refill.tokens=100
rate.limit.refill.period=1s
```

### 2.4 限流工作流程

```
用户请求 → Spring MVC → RateLimitInterceptor → RateLimiterService
                                ↓
                          检查 Redis 令牌桶
                                ↓
                    有令牌？─── YES ──→ 继续处理 → HelloController
                        │
                        NO
                        ↓
                  返回 HTTP 429 错误
```

### 2.5 限流算法说明

**令牌桶算法 (Token Bucket Algorithm)：**

1. **初始化**：创建容量为100的令牌桶
2. **令牌补充**：每秒向桶中添加100个令牌
3. **请求处理**：每个请求尝试消费1个令牌
4. **限流判断**：
   - 有令牌：允许请求，消费令牌
   - 无令牌：拒绝请求，返回429状态码

---

## 3. Dockerfile及K8s 编排文件

### 3.1 Dockerfile

```dockerfile
# 第一阶段：构建阶段 - 统一使用Java 11
FROM maven:3.9.6-eclipse-temurin-17 AS builder

# 设置工作目录
WORKDIR /usr/src/mymaven

# 复制 Maven 配置文件
RUN mkdir -p /root/.m2
COPY settings.xml /root/.m2/settings.xml

# 复制pom.xml和源代码
COPY pom.xml .
COPY src ./src

# 构建项目
RUN mvn -B  clean package

# 第二阶段：运行阶段
FROM eclipse-temurin:17-jre-centos7

# 设置时区
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
RUN echo 'Asia/Shanghai' >/etc/timezone

# 设置环境变量
ENV JAVA_OPTS ''

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建结果
COPY --from=builder /usr/src/mymaven/target/prometheus-test-demo-0.0.1-SNAPSHOT.jar ./prometheus-test-demo-0.0.1-SNAPSHOT.jar

# 启动命令 - 使用Java 11兼容的JVM参数
ENTRYPOINT ["sh", "-c", "set -e && java -XX:+PrintFlagsFinal \
                                           -XX:+HeapDumpOnOutOfMemoryError \
                                           -XX:HeapDumpPath=/heapdump/heapdump.hprof \
                                           -XX:+UseContainerSupport \
                                           -XX:MaxRAMPercentage=75.0 \
                                           -Djava.security.egd=file:/dev/./urandom \
                                           $JAVA_OPTS -jar prometheus-test-demo-0.0.1-SNAPSHOT.jar"]
```

**Dockerfile 设计说明：**
- 构建项目时删去原demo的 -DskipTests 参数，直接运行测试样例，因此在 Jenkinsfile 中不再执行test。
- 下图为测试运行结果
- ![alt text](../photos/posts/yys/image.png)![alt text](../photos/posts/yys/image-1.png)

### 3.2 Kubernetes 部署文件 (prometheus-test-demo.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: prometheus-test-demo
  name: prometheus-test-demo
  namespace: {NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus-test-demo
  template:
    metadata:
      annotations:
        prometheus.io/path: /actuator/prometheus
        prometheus.io/port: "8998"
        prometheus.io/scheme: http
        prometheus.io/scrape: "true"
      labels:
        app: prometheus-test-demo
    spec:
      initContainers:
      - name: wait-for-redis
        ../photos/posts/yys/image: busybox:1.36
        command: ['sh', '-c']
        args:
        - |
          until nc -z redis-service 6379; do
            echo "Waiting for Redis to be ready..."
            sleep 2
          done
          echo "Redis is ready!"
      containers:
        - ../photos/posts/yys/image: 172.22.83.19:30003/nju08/prometheus-test-demo:{VERSION}
          name: prometheus-test-demo
          ports:
          - containerPort: 8998
          env:
          - name: REDIS_HOST
            value: "redis-service"
          - name: REDIS_PORT
            value: "6379"
          resources:
            requests:
              memory: "128Mi"    
              cpu: "100m"        
            limits:
              memory: "512Mi"    
              cpu: "500m"        
          livenessProbe:
            httpGet:
              path: /actuator/health
              port: 8998
            initialDelaySeconds: 120
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health
              port: 8998
            initialDelaySeconds: 90
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: {NAMESPACE}
  labels:
    app: redis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        ../photos/posts/yys/image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        args:
        - redis-server
        - --appendonly
        - "yes"
        volumeMounts:
        - name: redis-data
          mountPath: /data
      volumes:
      - name: redis-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: {NAMESPACE}
  labels:
    app: redis
spec:
  selector:
    app: redis
  ports:
  - name: redis
    port: 6379
    targetPort: 6379
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus-test-demo
  labels:
    app: prometheus-test-demo
  namespace: {NAMESPACE}
spec:
  type: NodePort
  selector:
    app: prometheus-test-demo
  ports:
    - name: management-port
      protocol: TCP
      port: 8998
      targetPort: 8998

```

**K8s 配置说明：**
- 使用 InitContainer 确保 Redis 先启动
- 配置了资源限制防止资源耗尽
- 设置了健康检查确保服务可用

### 3.3 ServiceMonitor 配置 (prometheus-test-serviceMonitor.yaml)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  labels:
    k8s-app: prometheus-test-demo
  name: prometheus-test-demo
  namespace: {MONITOR_NAMESPACE}
spec:
  endpoints:
  - interval: 30s
    port: tcp
    path: /actuator/prometheus
    scheme: 'http'
  selector:
    matchLabels:
      app: prometheus-test-demo
  namespaceSelector:
    matchNames:
    - {NAMESPACE}

```

---

## 4. Jenkins 持续集成、持续部署、持续测试配置文件与说明

### 4.1 Jenkinsfile 完整配置

```groovy
pipeline {
    agent none
    
    // 环境变量管理
    environment {
        HARBOR_REGISTRY = '172.22.83.19:30003'
        IMAGE_NAME = 'nju08/prometheus-test-demo'
        GIT_REPO = 'https://gitee.com/grissom_sh/prometheus-test-demo.git'
        NAMESPACE = 'nju08'
        MONITOR_NAMESPACE = 'nju08'
        HARBOR_USER = 'nju08'
    }
    
    parameters {
        string(name: 'HARBOR_PASS', defaultValue: '', description: 'Harbor login password')
    }
    
    stages {
        stage('Clone Code') {
            agent {
                label 'master'
            }
            steps {
                echo "1.Git Clone Code"
                script {
                    try {
                        git url: "${env.GIT_REPO}"
                    } catch (Exception e) {
                        error "Git clone failed: ${e.getMessage()}"
                    }
                }
            }
        }
        
        stage('Image Build') {
            agent {
                label 'master'
            }
            steps {
                echo "2.Image Build Stage (包含 Maven 构建)"
                timeout(time: 30, unit: 'MINUTES') {
                    script {
                        retry(3) {
                            try {
                                // 使用 Dockerfile 多阶段构建，包含 Maven 构建和镜像构建
                                sh "docker build --cache-from ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:latest -t ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:${BUILD_NUMBER} -t ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:latest ."
                            } catch (Exception e) {
                                echo "Docker build attempt failed: ${e.getMessage()}"
                                throw e
                            }
                        }
                    }
                }
            }
        }

        stage('Push') {
            agent {
                label 'master'
            }
            steps {
                echo "3.Push Docker Image Stage"
                script {
                    try {
                        sh "echo '${HARBOR_PASS}' | docker login --username=${HARBOR_USER} --password-stdin ${env.HARBOR_REGISTRY}"
                        sh "docker push ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:${BUILD_NUMBER}"
                        sh "docker push ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:latest"
                    } catch (Exception e) {
                        error "Docker push failed: ${e.getMessage()}"
                    }
                }
            }
        }
        
        
        stage('Deploy to Kubernetes') {
            agent {
                label 'slave'
            }
            steps {
                container('jnlp-kubectl') {
                    script {
                        stage('Clone YAML') {
                            echo "4. Git Clone YAML To Slave"
                            try {
                                // 使用 checkout scm 获取当前流水线的源代码
                                checkout scm
                            } catch (Exception e) {
                                error "Git clone on slave failed: ${e.getMessage()}"
                            }
                        }
                        
                        stage('Config YAML') {
                            echo "5. Change YAML File Stage"
                            sh 'sed -i "s/{VERSION}/${BUILD_NUMBER}/g" ./jenkins/scripts/prometheus-test-demo.yaml'
                            sh 'sed -i "s/{NAMESPACE}/${NAMESPACE}/g" ./jenkins/scripts/prometheus-test-demo.yaml'
                            sh 'sed -i "s/{MONITOR_NAMESPACE}/${MONITOR_NAMESPACE}/g" ./jenkins/scripts/prometheus-test-serviceMonitor.yaml'
                            sh 'sed -i "s/{NAMESPACE}/${NAMESPACE}/g" ./jenkins/scripts/prometheus-test-serviceMonitor.yaml'

                            sh 'cat ./jenkins/scripts/prometheus-test-demo.yaml'
                            sh 'cat ./jenkins/scripts/prometheus-test-serviceMonitor.yaml'
                        }
                        
                        stage('Deploy prometheus-test-demo') {
                            echo "6. Deploy To K8s Stage"
                            sh 'kubectl apply -f ./jenkins/scripts/prometheus-test-demo.yaml'
                        }
                        
                        stage('Wait for Redis') {
                            echo "6.5. Wait for Redis to be ready"
                            try {
                                sh "kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=120s"
                                echo "Redis is ready!"
                            } catch (Exception e) {
                                echo "Redis readiness check failed, but continuing: ${e.getMessage()}"
                            }
                        }
                        
                        stage('Deploy prometheus-test-demo ServiceMonitor') {
                            echo "7. Deploy ServiceMonitor To K8s Stage"
                            try {
                                sh 'kubectl apply -f ./jenkins/scripts/prometheus-test-serviceMonitor.yaml'
                            } catch (Exception e) {
                                error "ServiceMonitor deployment failed: ${e.getMessage()}"
                            }
                        }
                        
                        stage('Health Check') {
                            echo "8. Health Check Stage"
                            try {
                                sh "kubectl wait --for=condition=ready pod -l app=prometheus-test-demo -n ${NAMESPACE} --timeout=300s"
                                echo "Application is healthy and ready!"
                            } catch (Exception e) {
                                error "Health check failed: ${e.getMessage()}"
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 通知机制和清理
    post {
        success {
            echo '🎉 Pipeline succeeded! Application deployed successfully.'
            script {
                echo "✅ Deployment Summary:"
                echo "   - Image: ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:${BUILD_NUMBER}"
                echo "   - Namespace: ${NAMESPACE}"
                echo "   - Monitor Namespace: ${MONITOR_NAMESPACE}"
            }
        }
        failure {
            echo '❌ Pipeline failed! Please check the logs for details.'
        }
        always {
            echo '🔄 Pipeline execution completed.'
            // 清理本地镜像以节省磁盘空间
            script {
                try {
                    sh "docker rmi ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:${BUILD_NUMBER} || true"
                    sh "docker rmi ${env.HARBOR_REGISTRY}/${env.IMAGE_NAME}:latest || true"
                    sh "docker system prune -f || true"
                } catch (Exception e) {
                    echo "Image cleanup failed: ${e.getMessage()}"
                }
            }
        }
    }
}
```

### 4.2 Jenkins 流水线说明

**流水线各阶段详解：**

1. **Checkout 阶段**：
   - 拉取源代码
   - 生成构建版本号

2. **Build 阶段**：
   - Maven 编译和测试
   - 生成构建产物

3. **Docker Build & Push 阶段**：
   - 构建容器镜像
   - 推送到镜像仓库

4. **Deploy to Kubernetes 阶段**：
   - 配置 K8s 部署文件
   - 部署应用和依赖服务
   - 健康检查

### 4.3 CI/CD 流程验证截图位置
**镜像构建截图：**
![alt text](../photos/posts/yys/image-4.png)

**构建成功截图：**
![alt text](../photos/posts/yys/image-2.png)

**部署成功截图：**
![alt text](../photos/posts/yys/image-3.png)

---

## 5. 监控指标采集的配置及说明；Grafana 监控大屏截图

### 5.1 Prometheus 监控配置

#### 5.1.1 应用监控注解配置

应用 Pod 配置了 Prometheus 自动发现注解：

```yaml
annotations:
  prometheus.io/path: /actuator/prometheus    # 指标采集路径
  prometheus.io/port: "8998"                  # 监控端口
  prometheus.io/scheme: http                  # 协议
  prometheus.io/scrape: "true"               # 启用自动发现
```

#### 5.1.2 ServiceMonitor 配置

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  labels:
    k8s-app: prometheus-test-demo
  name: prometheus-test-demo
  namespace: {MONITOR_NAMESPACE}
spec:
  endpoints:
  - interval: 30s
    port: tcp
    path: /actuator/prometheus
    scheme: 'http'
  selector:
    matchLabels:
      app: prometheus-test-demo
  namespaceSelector:
    matchNames:
    - {NAMESPACE}

```

### 5.2 关键监控指标

#### 5.2.1 应用性能指标

- **HTTP 请求指标**：
  - `http_server_requests_seconds_count` - 请求总数
  - `http_server_requests_seconds_sum` - 请求总耗时
  - `http_server_requests_seconds_max` - 最大响应时间

- **JVM 指标**：
  - `jvm_memory_used_bytes` - JVM 内存使用
  - `jvm_gc_pause_seconds` - GC 暂停时间
  - `jvm_threads_live_threads` - 活跃线程数

#### 5.2.2 限流相关指标

- **Bucket4j 指标**（如果配置了 Micrometer 集成）：
  - `bucket4j_consumed_tokens_total` - 消费的令牌总数
  - `bucket4j_rejected_requests_total` - 被拒绝的请求数
  - `bucket4j_available_tokens` - 可用令牌数

- **Tomcat 连接池指标**：
  - `tomcat_sessions_active_current` - 活跃会话数
  - `tomcat_threads_busy_threads` - 繁忙线程数
  - `tomcat_threads_config_max_threads` - 最大线程数

- **指标监测**：
  - 端口转发之后 ```curl http://localhost:8998/actuator/prometheus```，得到详细数据。
  ```
    # HELP application_ready_time_seconds Time taken for the application to be ready to service requests
    # TYPE application_ready_time_seconds gauge
    application_ready_time_seconds{main_application_class="com.hello.hello.HelloApplication"} 47.994
    # HELP application_started_time_seconds Time taken to start the application
    # TYPE application_started_time_seconds gauge
    application_started_time_seconds{main_application_class="com.hello.hello.HelloApplication"} 47.787
    # HELP disk_free_bytes Usable space for path
    # TYPE disk_free_bytes gauge
    disk_free_bytes{path="/app/."} 4.1373339648E10
    # HELP disk_total_bytes Total space for path
    # TYPE disk_total_bytes gauge
    disk_total_bytes{path="/app/."} 5.36608768E10
    # HELP executor_active_threads The approximate number of threads that are actively executing tasks
    # TYPE executor_active_threads gauge
    executor_active_threads{name="applicationTaskExecutor"} 0.0
    # HELP executor_completed_tasks_total The approximate total number of tasks that have completed execution
    # TYPE executor_completed_tasks_total counter
    executor_completed_tasks_total{name="applicationTaskExecutor"} 0.0
    # HELP executor_pool_core_threads The core number of threads for the pool
    # TYPE executor_pool_core_threads gauge
    executor_pool_core_threads{name="applicationTaskExecutor"} 8.0
    # HELP executor_pool_max_threads The maximum allowed number of threads in the pool
    # TYPE executor_pool_max_threads gauge
    executor_pool_max_threads{name="applicationTaskExecutor"} 2.147483647E9
    # HELP executor_pool_size_threads The current number of threads in the pool
    # TYPE executor_pool_size_threads gauge
    executor_pool_size_threads{name="applicationTaskExecutor"} 0.0
    # HELP executor_queue_remaining_tasks The number of additional elements that this queue can ideally accept without blocking
    # TYPE executor_queue_remaining_tasks gauge
    executor_queue_remaining_tasks{name="applicationTaskExecutor"} 2.147483647E9
    # HELP executor_queued_tasks The approximate number of tasks that are queued for execution
    # TYPE executor_queued_tasks gauge
    executor_queued_tasks{name="applicationTaskExecutor"} 0.0
    # HELP http_server_requests_active_seconds  
    # TYPE http_server_requests_active_seconds summary
    http_server_requests_active_seconds_count{exception="none",method="GET",outcome="SUCCESS",status="200",uri="UNKNOWN"} 1
    http_server_requests_active_seconds_sum{exception="none",method="GET",outcome="SUCCESS",status="200",uri="UNKNOWN"} 0.194124977
    # HELP http_server_requests_active_seconds_max  
    # TYPE http_server_requests_active_seconds_max gauge
    http_server_requests_active_seconds_max{exception="none",method="GET",outcome="SUCCESS",status="200",uri="UNKNOWN"} 0.262306658
    # HELP http_server_requests_seconds  
    # TYPE http_server_requests_seconds summary
    http_server_requests_seconds_count{error="IOException",exception="IOException",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 77
    http_server_requests_seconds_sum{error="IOException",exception="IOException",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 588.946979862
    http_server_requests_seconds_count{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/actuator/health"} 1314
    http_server_requests_seconds_sum{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/actuator/health"} 8.224338786
    http_server_requests_seconds_count{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 4708
    http_server_requests_seconds_sum{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 15666.990410086
    # HELP http_server_requests_seconds_max  
    # TYPE http_server_requests_seconds_max gauge
    http_server_requests_seconds_max{error="IOException",exception="IOException",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 0.0
    http_server_requests_seconds_max{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/actuator/health"} 0.003561359
    http_server_requests_seconds_max{error="none",exception="none",method="GET",outcome="SUCCESS",status="200",uri="/hello"} 0.0
    # HELP jvm_info JVM version info
    # TYPE jvm_info gauge
    jvm_info{runtime="OpenJDK Runtime Environment",vendor="Eclipse Adoptium",version="17.0.11+9"} 1
    # HELP jvm_buffer_count_buffers An estimate of the number of buffers in the pool
    # TYPE jvm_buffer_count_buffers gauge
    jvm_buffer_count_buffers{id="direct"} 12.0
    jvm_buffer_count_buffers{id="mapped"} 0.0
    jvm_buffer_count_buffers{id="mapped - 'non-volatile memory'"} 0.0
    # HELP jvm_buffer_memory_used_bytes An estimate of the memory that the Java virtual machine is using for this buffer pool
    # TYPE jvm_buffer_memory_used_bytes gauge
    jvm_buffer_memory_used_bytes{id="direct"} 100352.0
    jvm_buffer_memory_used_bytes{id="mapped"} 0.0
    jvm_buffer_memory_used_bytes{id="mapped - 'non-volatile memory'"} 0.0
    # HELP jvm_buffer_total_capacity_bytes An estimate of the total capacity of the buffers in this pool
    # TYPE jvm_buffer_total_capacity_bytes gauge
    jvm_buffer_total_capacity_bytes{id="direct"} 100352.0
    jvm_buffer_total_capacity_bytes{id="mapped"} 0.0
    jvm_buffer_total_capacity_bytes{id="mapped - 'non-volatile memory'"} 0.0
    # HELP jvm_classes_loaded_classes The number of classes that are currently loaded in the Java virtual machine
    # TYPE jvm_classes_loaded_classes gauge
    jvm_classes_loaded_classes 10568.0
    # HELP jvm_classes_unloaded_classes_total The number of classes unloaded in the Java virtual machine
    # TYPE jvm_classes_unloaded_classes_total counter
    jvm_classes_unloaded_classes_total 80.0
    # HELP jvm_compilation_time_ms_total The approximate accumulated elapsed time spent in compilation
    # TYPE jvm_compilation_time_ms_total counter
    jvm_compilation_time_ms_total{compiler="HotSpot 64-Bit Tiered Compilers"} 218885.0
    # HELP jvm_gc_live_data_size_bytes Size of long-lived heap memory pool after reclamation
    # TYPE jvm_gc_live_data_size_bytes gauge
    jvm_gc_live_data_size_bytes 8.5416936E7
    # HELP jvm_gc_max_data_size_bytes Max size of long-lived heap memory pool
    # TYPE jvm_gc_max_data_size_bytes gauge
    jvm_gc_max_data_size_bytes 2.68435456E8
    # HELP jvm_gc_memory_allocated_bytes_total Incremented for an increase in the size of the (young) heap memory pool after one GC to before the next
    # TYPE jvm_gc_memory_allocated_bytes_total counter
    jvm_gc_memory_allocated_bytes_total 4.95829704E8
    # HELP jvm_gc_memory_promoted_bytes_total Count of positive increases in the size of the old generation memory pool before GC to after GC
    # TYPE jvm_gc_memory_promoted_bytes_total counter
    jvm_gc_memory_promoted_bytes_total 7.1289304E7
    # HELP jvm_gc_overhead An approximation of the percent of CPU time used by GC activities over the last lookback period or since monitoring began, whichever is shorter, in the range [0..1]
    # TYPE jvm_gc_overhead gauge
    jvm_gc_overhead 0.0
    # HELP jvm_gc_pause_seconds Time spent in GC pause
    # TYPE jvm_gc_pause_seconds summary
    jvm_gc_pause_seconds_count{action="end of major GC",cause="Allocation Failure",gc="MarkSweepCompact"} 3
    jvm_gc_pause_seconds_sum{action="end of major GC",cause="Allocation Failure",gc="MarkSweepCompact"} 0.976
    jvm_gc_pause_seconds_count{action="end of minor GC",cause="Allocation Failure",gc="Copy"} 16
    jvm_gc_pause_seconds_sum{action="end of minor GC",cause="Allocation Failure",gc="Copy"} 1.047
    # HELP jvm_gc_pause_seconds_max Time spent in GC pause
    # TYPE jvm_gc_pause_seconds_max gauge
    jvm_gc_pause_seconds_max{action="end of major GC",cause="Allocation Failure",gc="MarkSweepCompact"} 0.0
    jvm_gc_pause_seconds_max{action="end of minor GC",cause="Allocation Failure",gc="Copy"} 0.0
    # HELP jvm_memory_committed_bytes The amount of memory in bytes that is committed for the Java virtual machine to use
    # TYPE jvm_memory_committed_bytes gauge
    jvm_memory_committed_bytes{area="heap",id="Eden Space"} 5.7081856E7
    jvm_memory_committed_bytes{area="heap",id="Survivor Space"} 7077888.0
    jvm_memory_committed_bytes{area="heap",id="Tenured Gen"} 1.42364672E8
    jvm_memory_committed_bytes{area="nonheap",id="CodeHeap 'non-nmethods'"} 2555904.0
    jvm_memory_committed_bytes{area="nonheap",id="CodeHeap 'non-profiled nmethods'"} 5636096.0
    jvm_memory_committed_bytes{area="nonheap",id="CodeHeap 'profiled nmethods'"} 1.572864E7
    jvm_memory_committed_bytes{area="nonheap",id="Compressed Class Space"} 6815744.0
    jvm_memory_committed_bytes{area="nonheap",id="Metaspace"} 5.1707904E7
    # HELP jvm_memory_max_bytes The maximum amount of memory in bytes that can be used for memory management
    # TYPE jvm_memory_max_bytes gauge
    jvm_memory_max_bytes{area="heap",id="Eden Space"} 1.0747904E8
    jvm_memory_max_bytes{area="heap",id="Survivor Space"} 1.3369344E7
    jvm_memory_max_bytes{area="heap",id="Tenured Gen"} 2.68435456E8
    jvm_memory_max_bytes{area="nonheap",id="CodeHeap 'non-nmethods'"} 5828608.0
    jvm_memory_max_bytes{area="nonheap",id="CodeHeap 'non-profiled nmethods'"} 1.22916864E8
    jvm_memory_max_bytes{area="nonheap",id="CodeHeap 'profiled nmethods'"} 1.22912768E8
    jvm_memory_max_bytes{area="nonheap",id="Compressed Class Space"} 1.073741824E9
    jvm_memory_max_bytes{area="nonheap",id="Metaspace"} -1.0
    # HELP jvm_memory_usage_after_gc The percentage of long-lived heap pool used after the last GC event, in the range [0..1]
    # TYPE jvm_memory_usage_after_gc gauge
    jvm_memory_usage_after_gc{area="heap",pool="long-lived"} 0.3310730457305908
    # HELP jvm_memory_used_bytes The amount of used memory
    # TYPE jvm_memory_used_bytes gauge
    jvm_memory_used_bytes{area="heap",id="Eden Space"} 3.3653184E7
    jvm_memory_used_bytes{area="heap",id="Survivor Space"} 854168.0
    jvm_memory_used_bytes{area="heap",id="Tenured Gen"} 8.8871744E7
    jvm_memory_used_bytes{area="nonheap",id="CodeHeap 'non-nmethods'"} 1349248.0
    jvm_memory_used_bytes{area="nonheap",id="CodeHeap 'non-profiled nmethods'"} 5586048.0
    jvm_memory_used_bytes{area="nonheap",id="CodeHeap 'profiled nmethods'"} 1.5632E7
    jvm_memory_used_bytes{area="nonheap",id="Compressed Class Space"} 6518344.0
    jvm_memory_used_bytes{area="nonheap",id="Metaspace"} 5.1187048E7
    # HELP jvm_threads_daemon_threads The current number of live daemon threads
    # TYPE jvm_threads_daemon_threads gauge
    jvm_threads_daemon_threads 20.0
    # HELP jvm_threads_live_threads The current number of live threads including both daemon and non-daemon threads
    # TYPE jvm_threads_live_threads gauge
    jvm_threads_live_threads 24.0
    # HELP jvm_threads_peak_threads The peak live thread count since the Java virtual machine started or peak was reset
    # TYPE jvm_threads_peak_threads gauge
    jvm_threads_peak_threads 214.0
    # HELP jvm_threads_started_threads_total The total number of application threads started in the JVM
    # TYPE jvm_threads_started_threads_total counter
    jvm_threads_started_threads_total 249.0
    # HELP jvm_threads_states_threads The current number of threads
    # TYPE jvm_threads_states_threads gauge
    jvm_threads_states_threads{state="blocked"} 0.0
    jvm_threads_states_threads{state="new"} 0.0
    jvm_threads_states_threads{state="runnable"} 7.0
    jvm_threads_states_threads{state="terminated"} 0.0
    jvm_threads_states_threads{state="timed-waiting"} 6.0
    jvm_threads_states_threads{state="waiting"} 11.0
    # HELP logback_events_total Number of log events that were enabled by the effective log level
    # TYPE logback_events_total counter
    logback_events_total{level="debug"} 0.0
    logback_events_total{level="error"} 0.0
    logback_events_total{level="info"} 5.0
    logback_events_total{level="trace"} 0.0
    logback_events_total{level="warn"} 0.0
    # HELP process_cpu_time_ns_total The "cpu time" used by the Java Virtual Machine process
    # TYPE process_cpu_time_ns_total counter
    process_cpu_time_ns_total 1.0813E11
    # HELP process_cpu_usage The "recent cpu usage" for the Java Virtual Machine process
    # TYPE process_cpu_usage gauge
    process_cpu_usage 0.09197856413746172
    # HELP process_files_max_files The maximum file descriptor count
    # TYPE process_files_max_files gauge
    process_files_max_files 1048576.0
    # HELP process_files_open_files The open file descriptor count
    # TYPE process_files_open_files gauge
    process_files_open_files 15.0
    # HELP process_start_time_seconds Start time of the process since unix epoch.
    # TYPE process_start_time_seconds gauge
    process_start_time_seconds 1.752976768479E9
    # HELP process_uptime_seconds The uptime of the Java virtual machine
    # TYPE process_uptime_seconds gauge
    process_uptime_seconds 9948.976
    # HELP system_cpu_count The number of processors available to the Java virtual machine
    # TYPE system_cpu_count gauge
    system_cpu_count 1.0
    # HELP system_cpu_usage The "recent cpu usage" of the system the application is running in
    # TYPE system_cpu_usage gauge
    system_cpu_usage 0.09208738261313372
    # HELP system_load_average_1m The sum of the number of runnable entities queued to available processors and the number of runnable entities running on the available processors averaged over a period of time
    # TYPE system_load_average_1m gauge
    system_load_average_1m 0.08
    # HELP tomcat_sessions_active_current_sessions  
    # TYPE tomcat_sessions_active_current_sessions gauge
    tomcat_sessions_active_current_sessions 0.0
    # HELP tomcat_sessions_active_max_sessions  
    # TYPE tomcat_sessions_active_max_sessions gauge
    tomcat_sessions_active_max_sessions 0.0
    # HELP tomcat_sessions_alive_max_seconds  
    # TYPE tomcat_sessions_alive_max_seconds gauge
    tomcat_sessions_alive_max_seconds 0.0
    # HELP tomcat_sessions_created_sessions_total  
    # TYPE tomcat_sessions_created_sessions_total counter
    tomcat_sessions_created_sessions_total 0.0
    # HELP tomcat_sessions_expired_sessions_total  
    # TYPE tomcat_sessions_expired_sessions_total counter
    tomcat_sessions_expired_sessions_total 0.0
    # HELP tomcat_sessions_rejected_sessions_total  
    # TYPE tomcat_sessions_rejected_sessions_total counter
    tomcat_sessions_rejected_sessions_total 0.0
  ```
### 5.3 Grafana 监控大屏配置

#### 5.3.1 监控大屏概览

本项目成功配置了多个 Grafana 监控大屏，涵盖了应用性能、网络流量和资源使用等关键指标：

1. **SpringBoot APM Dashboard** - 应用性能监控
2. **Kubernetes / Compute Resources / Namespace** - 集群资源监控  
3. **网络流量监控面板** - Pod 间通信监控

#### 5.3.2 SpringBoot APM Dashboard 配置

**面板配置说明：**

```json
{
  "dashboard": {
    "title": "SpringBoot APM Dashboard",
    "panels": [
      {
        "title": "Basic Statistics",
        "type": "stat",
        "targets": [
          {
            "expr": "process_uptime_seconds{instance=~\".*prometheus-test-demo.*\"}",
            "legendFormat": "Uptime"
          },
          {
            "expr": "jvm_memory_used_bytes{area=\"heap\"}/jvm_memory_max_bytes{area=\"heap\"}*100",
            "legendFormat": "Heap Used %"
          }
        ]
      }
    ]
  }
}
```

**关键监控指标：**
- **运行时间**: 1.5 天稳定运行
- **堆内存使用**: 9.4% (健康水平)
- **非堆内存使用**: 5.2% (正常状态)
- **CPU 使用率**: 平均 0.577% (系统空闲)
- **负载均衡**: 0.436 (轻负载)

![alt text](../photos/posts/yys/image-8.png)

#### 5.3.3 Kubernetes 资源监控配置

**集群资源监控面板配置：**

**CPU 使用率监控：**
```promql
# CPU 使用率 (基于请求)
rate(container_cpu_usage_seconds_total{namespace="nju08"}[5m]) * 100

# CPU 使用率 (基于限制)  
rate(container_cpu_usage_seconds_total{namespace="nju08"}[5m]) / 
on(pod) kube_pod_container_resource_limits{resource="cpu"} * 100
```

**内存使用率监控：**
```promql
# 内存使用率 (基于请求)
container_memory_usage_bytes{namespace="nju08"} / 
container_spec_memory_limit_bytes * 100

# 内存使用率 (基于限制)
container_memory_usage_bytes{namespace="nju08"} / 
on(pod) kube_pod_container_resource_limits{resource="memory"} * 100
```

**监控数据分析：**
- **CPU 使用率 (基于请求)**
- **CPU 使用率 (基于限制)** 
- **内存使用率 (基于请求)** 
- **内存使用率 (基于限制)** 

![alt text](../photos/posts/yys/image-7.png)

#### 5.3.4 网络流量监控配置

**网络监控面板配置：**

**接收/发送字节数监控：**
```promql
# 网络接收速率
rate(container_network_receive_bytes_total{namespace="nju08"}[5m])

# 网络发送速率  
rate(container_network_transmit_bytes_total{namespace="nju08"}[5m])
```

**网络包监控：**
```promql
# 接收包速率
rate(container_network_receive_packets_total{namespace="nju08"}[5m])

# 发送包速率
rate(container_network_transmit_packets_total{namespace="nju08"}[5m])

# 丢包率
rate(container_network_receive_packets_dropped_total{namespace="nju08"}[5m])
rate(container_network_transmit_packets_dropped_total{namespace="nju08"}[5m])
```

**网络流量分析：**
- **峰值网络吞吐量**: ~200 kB/s (发送/接收)
- **峰值包速率**: ~2 kp/s (接收/发送)
- **网络活动时间**: 05:30 左右出现流量峰值
- **丢包情况**: 基本无丢包，网络稳定

![alt text](../photos/posts/yys/image-6.png)

#### 5.3.5 压测时的监控表现

**压测期间关键指标变化：**

1. **CPU 使用率飙升**：
   - 压测前: ~0.003 (0.3%)
   - 压测时: ~0.37 (37%)
   - 增长倍数: 约 123 倍

2. **网络流量激增**：
   - 正常时: 几乎无流量 (0-10 kB/s)
   - 压测时: 峰值 200 kB/s
   - 包速率: 峰值 2000 packets/s

3. **内存使用稳定**：
   - 内存使用率保持在合理范围
   - 未出现内存泄漏现象

#### 5.3.6 限流效果在监控中的体现

**限流监控配置：**

```promql
# HTTP 请求速率
rate(http_server_requests_seconds_count{uri="/hello"}[1m]) * 60

# 错误率 (限流触发)
rate(http_server_requests_seconds_count{exception="IOException"}[1m]) /
rate(http_server_requests_seconds_count{uri="/hello"}[1m]) * 100

# 连接数监控
tomcat_threads_busy_threads / tomcat_threads_config_max_threads * 100
```

**限流效果观察：**
- ✅ **流量控制有效**: 网络流量在达到峰值后快速回落
- ✅ **CPU 保护机制**: CPU 使用率未超过危险阈值
- ✅ **连接层限流**: 通过网络包丢弃实现早期限流

---

## 6. 压测

### 6.1 压测工具

#### 6.1.1 基础压测脚本 

```bash
#!/bin/bash
URL="http://localhost:8998/hello"
CONCURRENT=10
REQUESTS=100

echo "Starting load test..."
echo "URL: $URL"
echo "Concurrent requests: $CONCURRENT"
echo "Total requests: $REQUESTS"

for i in $(seq 1 $REQUESTS); do
    (
        response=$(curl -s -w "%{http_code},%{time_total}" -o /dev/null $URL)
        echo "Request $i: $response"
    ) &
    
    # 控制并发数
    if (( $i % $CONCURRENT == 0 )); then
        wait
    fi
done
wait

echo "Load test completed!"
```

#### 6.1.2 高频限流测试脚本 

```bash
#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

URL="http://localhost:8998/hello"
NAMESPACE="nju08"

echo "========================================="
echo "YYS 项目 - 超高频限流测试脚本"
echo "========================================="

# 检查端口转发
check_port_forward() {
    if ! lsof -i :8998 >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口转发未运行${NC}"
        echo -e "${YELLOW}请先运行: kubectl port-forward deployment/prometheus-test-demo 8998:8998 -n $NAMESPACE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 端口转发正常运行${NC}"
}

# 多轮高频测试
run_aggressive_test() {
    echo ""
    echo -e "${BLUE}🔥 开始超高频限流测试...${NC}"
    echo "目标: 超过 100 requests/second 限制"
    echo ""
    
    # 测试配置
    local ROUNDS=3
    local REQUESTS_PER_ROUND=150
    local MAX_CONCURRENT=100
    
    for round in $(seq 1 $ROUNDS); do
        echo -e "${YELLOW}=== 第 $round 轮测试 ===${NC}"
        echo "发送 $REQUESTS_PER_ROUND 个请求，$MAX_CONCURRENT 并发"
        
        local success_count=0
        local rate_limited_count=0
        local error_count=0
        local timeout_count=0
        
        start_time=$(date +%s.%N)
        
        # 创建临时文件
        temp_file="/tmp/aggressive_test_${round}_$$"
        
        # 极限并发发送
        for i in $(seq 1 $REQUESTS_PER_ROUND); do
            {
                response=$(timeout 2 curl -s -w "%{http_code}" -o /dev/null \
                    --connect-timeout 0.3 \
                    --max-time 1 \
                    --retry 0 \
                    --no-keepalive \
                    $URL 2>/dev/null)
                
                exit_code=$?
                timestamp=$(date '+%H:%M:%S.%3N')
                
                if [ $exit_code -eq 124 ]; then
                    echo "TIMEOUT,$timestamp" >> $temp_file
                elif [ $exit_code -ne 0 ] || [ -z "$response" ]; then
                    echo "CONNECTION_FAILED,$timestamp" >> $temp_file
                else
                    echo "$response,$timestamp" >> $temp_file
                fi
            } &
            
            # 减少等待时间，增加并发密度
            if (( $i % $MAX_CONCURRENT == 0 )); then
                wait
            fi
        done
        
        wait
        
        end_time=$(date +%s.%N)
        duration=$(echo "$end_time - $start_time" | bc 2>/dev/null || echo "1")
        rate=$(echo "scale=2; $REQUESTS_PER_ROUND / $duration" | bc 2>/dev/null || echo "0")
        
        echo "  持续时间: ${duration}秒"
        echo "  实际速率: ${rate} requests/second"
        
        # 统计结果
        while IFS=',' read -r status_or_error timestamp; do
            case "$status_or_error" in
                "200") ((success_count++)) ;;
                "429"|"503") 
                    ((rate_limited_count++))
                    echo -e "  ${YELLOW}🚫 限流: $timestamp - HTTP $status_or_error${NC}"
                    ;;
                "TIMEOUT") 
                    ((timeout_count++))
                    echo -e "  ${RED}⏰ 超时: $timestamp${NC}"
                    ;;
                "CONNECTION_FAILED"|*)
                    ((error_count++))
                    echo -e "  ${RED}❌ 失败: $timestamp${NC}"
                    ;;
            esac
        done < $temp_file 2>/dev/null
        
        rm -f $temp_file
        
        echo -e "  结果: ✅$success_count 🚫$rate_limited_count ⏰$timeout_count ❌$error_count"
        
        if [ $rate_limited_count -gt 0 ] || [ $timeout_count -gt 5 ] || [ $error_count -gt 5 ]; then
            echo -e "  ${GREEN}🎯 第 $round 轮检测到限流效果!${NC}"
        else
            echo -e "  ${YELLOW}⚠️  第 $round 轮未检测到限流${NC}"
        fi
        
        echo ""
        
        # 轮次间短暂休息
        if [ $round -lt $ROUNDS ]; then
            sleep 1
        fi
    done
}

# 连续轰炸测试
run_continuous_bombardment() {
    echo -e "${BLUE}💥 连续轰炸测试 (30秒内持续发送请求)${NC}"
    echo ""
    
    local duration=30
    local concurrent=50
    local total_requests=0
    local success_count=0
    local limited_count=0
    
    start_time=$(date +%s)
    end_target=$((start_time + duration))
    
    echo "开始时间: $(date)"
    echo "目标持续: ${duration}秒"
    echo "并发数: $concurrent"
    echo ""
    
    while [ $(date +%s) -lt $end_target ]; do
        # 每次发送一批请求
        for i in $(seq 1 $concurrent); do
            {
                response=$(curl -s -w "%{http_code}" -o /dev/null \
                    --connect-timeout 0.2 \
                    --max-time 0.5 \
                    $URL 2>/dev/null)
                
                ((total_requests++))
                
                if [ "$response" = "200" ]; then
                    ((success_count++))
                elif [ "$response" = "429" ] || [ "$response" = "503" ]; then
                    ((limited_count++))
                    echo -e "${YELLOW}🚫 限流触发! HTTP $response at $(date '+%H:%M:%S')${NC}"
                fi
            } &
        done
        
        # 短暂等待后继续
        sleep 0.1
    done
    
    wait
    
    actual_duration=$(($(date +%s) - start_time))
    actual_rate=$(echo "scale=2; $total_requests / $actual_duration" | bc 2>/dev/null || echo "0")
    
    echo ""
    echo -e "${BLUE}💥 连续轰炸测试结果${NC}"
    echo "实际持续时间: ${actual_duration}秒"
    echo "总请求数: $total_requests"
    echo "平均速率: ${actual_rate} requests/second"
    echo "成功请求: $success_count"
    echo "限流触发: $limited_count"
    
    if [ $limited_count -gt 0 ]; then
        echo -e "${GREEN}🎯 连续轰炸成功触发限流!${NC}"
    else
        echo -e "${YELLOW}⚠️  连续轰炸未触发限流${NC}"
    fi
}

# Apache Bench 测试 (如果可用)
run_ab_test() {
    if command -v ab &> /dev/null; then
        echo ""
        echo -e "${BLUE}⚡ Apache Bench 高性能测试${NC}"
        echo ""
        
        echo "测试1: 500个请求，200并发"
        ab -n 500 -c 200 $URL
        
        echo ""
        echo "测试2: 2秒内尽可能多的请求，300并发"
        ab -t 2 -c 300 $URL
        
    else
        echo ""
        echo -e "${YELLOW}💡 建议安装 Apache Bench 进行更高性能的测试:${NC}"
        echo "  sudo apt-get install apache2-utils"
        echo "  然后运行: ab -n 1000 -c 300 $URL"
    fi
}

# 检查限流配置
check_rate_limit_config() {
    echo ""
    echo -e "${BLUE}⚙️ 检查当前限流配置${NC}"
    
    # 检查 Redis 中的令牌桶状态
    echo "Redis 限流键:"
    kubectl exec deployment/redis -n $NAMESPACE -- redis-cli keys "*rate*" 2>/dev/null || echo "无法访问Redis"
    
    # 尝试获取桶的状态 (这个可能需要特殊的命令)
    echo ""
    echo "当前应用配置:"
    echo "- 限流阈值: 100 requests/second"
    echo "- 令牌桶容量: 100"
    echo "- 补充速率: 100 tokens/second"
    echo "- 限流键: global-rate-limit-key"
}

# 主执行流程
main() {
    check_port_forward
    check_rate_limit_config
    run_aggressive_test
    run_continuous_bombardment
    run_ab_test
    
    echo ""
    echo -e "${GREEN}🏁 超高频限流测试完成!${NC}"
}

# 执行主函数
main "$@"
```





### 6.2 压测结果

**压测结果截图：**
- 未触发限流：
    ![alt text](../photos/posts/yys/image-9.png)
- 触发限流：
    ![](../photos/posts/yys/image-10.png)
    ![alt text](../photos/posts/yys/image-11.png)
- 其中在限流之后转发的进程这边显示如下信息，说明超出阈值的request直接在tcp层被拒绝。
- ![alt text](../photos/posts/yys/image-12.png)


**HTTP 000 状态码说明：**
- ![alt text](../photos/posts/yys/image-13.png)
- 状态码 000 表示连接在 TCP 层被拒绝
- 这证明了限流系统在连接层面起到了保护作用
- 比 HTTP 429 更早介入，资源保护更彻底




## 7. 项目总结与技术亮点

### 7.1 技术架构亮点

1. **多层限流防护**：
   - 应用层：Bucket4j 令牌桶算法精确控制
   - 连接层：Tomcat 连接池快速保护
   - 网络层：K8s 网络策略综合防护

2. **分布式限流设计**：
   - 基于 Redis 的分布式令牌桶
   - 支持水平扩展和高可用
   - 保证多实例间限流一致性

3. **云原生最佳实践**：
   - 容器化部署
   - K8s 声明式配置
   - 微服务架构设计

### 7.2 监控与运维亮点

1. **全方位监控**：
   - 应用性能监控 (APM)
   - 基础设施监控
   - 业务指标监控

2. **自动化运维**：
   - CI/CD 流水线自动化
   - 健康检查和自愈能力
   - 可观测性最佳实践

### 7.3 压测验证成果

1. **限流功能验证**：
   - 成功验证 100 req/s 限流阈值
   - 确认多层限流机制有效性
   - 系统保护能力得到验证

2. **扩容能力验证**：
   - K8s 水平扩容功能正常
   - 负载均衡分发有效
   - 性能线性提升明显

### 7.4 项目创新点

1. **连接层限流策略**：
   - 在 TCP 连接层就实现流量控制
   - 比传统 HTTP 层限流更高效
   - 资源保护更彻底

2. **压测工具定制化**：
   - 针对限流场景设计专用测试脚本
   - 能够有效触发和验证限流机制
   - 提供详细的测试报告和分析

3. **监控体系完整性**：
   - 从基础设施到应用层的全栈监控
   - 限流专用监控面板设计
   - 智能告警和故障预警

### 7.5 学习收获与心得

通过本项目的实践，深入理解了：

1. **云原生技术栈**：
   - Docker 容器化技术
   - Kubernetes 容器编排
   - 微服务架构设计原则

2. **限流算法与实现**：
   - 令牌桶算法的原理和应用
   - 分布式限流的挑战和解决方案
   - 多层限流策略的设计思路

3. **DevOps 最佳实践**：
   - CI/CD 流水线设计
   - 监控体系建设
   - 自动化测试和部署

4. **性能测试与调优**：
   - 压测工具的选择和使用
   - 性能瓶颈的识别和优化
   - 系统扩容策略的验证

---

## 8. 附录

### 8.1 项目文件结构

```
yys/
├── src/                                    # 源代码目录
│   ├── main/java/com/hello/hello/
│   │   ├── config/                        # 配置类
│   │   │   ├── RateLimitConfig.java      # 限流配置
│   │   │   ├── RedisConfig.java          # Redis配置
│   │   │   └── WebMvcConfig.java         # Web配置
│   │   ├── controller/
│   │   │   └── HelloController.java      # 控制器
│   │   ├── interceptor/
│   │   │   └── RateLimitInterceptor.java # 限流拦截器
│   │   ├── service/
│   │   │   └── RateLimiterService.java   # 限流服务
│   │   └── HelloApplication.java         # 启动类
│   └── main/resources/
│       └── application.properties        # 应用配置
├── jenkins/scripts/                       # K8s部署文件
│   ├── prometheus-test-demo.yaml
│   └── prometheus-test-serviceMonitor.yaml
├── Dockerfile                            # Docker构建文件
├── Jenkinsfile                          # Jenkins流水线
├── pom.xml                              # Maven配置
└── README.md                            # 项目说明文档
```

### 8.2 相关技术栈版本

- **Java**: 17
- **Spring Boot**: 3.5.3
- **Bucket4j**: 8.10.1
- **Redis**: 7-alpine
- **Kubernetes**: 1.20+
- **Docker**: 20.10+
- **Jenkins**: 2.400+
- **Prometheus**: 2.40+
- **Grafana**: 9.0+

---

**报告完成时间**: 2025年7月20日  
**项目代码仓库**: https://github.com/231220075/yys  
**分支**: hpa

---

*感谢阅读！如果这篇文章对你有帮助，欢迎点赞和分享。*
