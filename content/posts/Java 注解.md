---
title: Java 注解
date: 2025-08-12 16:18:13
updated: 2025-08-12 16:18:13
tags:
  - JAVA
categories:
  - 技术学习
description: yys-project中延伸学习Java注解，上传一下
top: false
comments: true
toc: true
mathjax: false
copyright: true
---

# 📝 Java 注解完全指南

> yys-project中延伸学习Java注解，上传一下



## 1. 什么是Java注解？

Java注解（Annotation）是Java 5引入的一种元数据机制，它为代码提供了一种描述性的信息，而不直接影响代码的执行逻辑。可以把注解理解为"给代码贴标签"，这些标签可以被编译器、开发工具或运行时环境读取和处理。

### 注解的本质
- 注解本质上是一种特殊的接口
- 继承自`java.lang.annotation.Annotation`接口
- 在编译后会生成相应的字节码信息

## 2. Java注解 vs C++的对比

| 特性 | Java注解 | C++宏/预处理指令 | C++属性(C++11+) |
|------|----------|------------------|-----------------|
| **语法** | `@注解名` | `#define`, `#pragma` | `[[属性名]]` |
| **处理时机** | 编译时/运行时 | 预处理时 | 编译时 |
| **类型安全** | 强类型 | 弱类型 | 强类型 |
| **反射支持** | 完全支持 | 不支持 | 有限支持 |
| **功能范围** | 元数据、验证、代码生成 | 文本替换、条件编译 | 优化提示、属性标记 |

### 举例对比：

**Java注解：**
```java
@Override
public String toString() {
    return "example";
}
```

**C++属性：**
```cpp
[[override]]
virtual std::string toString() {
    return "example";
}
```

**C++宏：**
```cpp
#define OVERRIDE virtual
OVERRIDE std::string toString() {
    return "example";
}
```

## 3. 注解的工作原理

### 3.1 编译时处理
```java
// 源代码
@Override
public void method() {}

// 编译后的字节码中会包含注解信息
// 可以通过反射API在运行时访问
```

### 3.2 三个处理阶段
1. **源码阶段**：注解存在于.java文件中
2. **编译阶段**：注解被编译器处理，可能生成额外代码
3. **运行阶段**：通过反射API读取注解信息

### 3.3 注解处理器（Annotation Processor）
```java
// 自定义注解处理器示例
@SupportedAnnotationTypes("com.example.MyAnnotation")
public class MyProcessor extends AbstractProcessor {
    @Override
    public boolean process(Set<? extends TypeElement> annotations, 
                          RoundEnvironment roundEnv) {
        // 在编译时处理注解
        return true;
    }
}
```

## 4. 注解的分类

### 4.1 按生命周期分类

#### SOURCE（源码级）
```java
@Retention(RetentionPolicy.SOURCE)
public @interface SourceAnnotation {
    String value();
}
```
- 只在源码中存在，编译后丢弃
- 主要用于编译时检查
- 例如：`@Override`, `@SuppressWarnings`

#### CLASS（字节码级）
```java
@Retention(RetentionPolicy.CLASS)
public @interface ClassAnnotation {
    String value();
}
```
- 在字节码中保留，但运行时不可访问
- 默认的保留策略
- 用于编译时或字节码处理工具

#### RUNTIME（运行时级）
```java
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeAnnotation {
    String value();
}
```
- 运行时可通过反射访问
- 最常用的类型
- 用于框架和库的运行时处理

### 4.2 按作用目标分类

```java
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface MyAnnotation {
    // 可以用在类和方法上
}
```

常见的ElementType：
- `TYPE`：类、接口、枚举
- `METHOD`：方法
- `FIELD`：字段
- `PARAMETER`：参数
- `CONSTRUCTOR`：构造器
- `PACKAGE`：包

## 5. 常见内置注解详解

### 5.1 基础注解

#### @Override
```java
public class Child extends Parent {
    @Override  // 确保正确重写父类方法
    public void method() {
        System.out.println("子类实现");
    }
}
```
**功能**：
- 编译时检查是否正确重写了父类方法
- 提高代码可读性
- 防止方法签名错误

#### @Deprecated
```java
public class OldAPI {
    @Deprecated(since = "1.5", forRemoval = true)
    public void oldMethod() {
        // 已废弃的方法
    }
    
    public void newMethod() {
        // 推荐使用的新方法
    }
}
```
**功能**：
- 标记已废弃的API
- 编译时产生警告
- 可以指定废弃版本和是否将被移除

#### @SuppressWarnings
```java
public class Example {
    @SuppressWarnings("unchecked")
    public void method() {
        List list = new ArrayList();  // 原始类型警告被抑制
        list.add("item");
    }
    
    @SuppressWarnings({"unused", "deprecation"})
    private void anotherMethod() {
        // 抑制多种警告
    }
}
```
**常用警告类型**：
- `unchecked`：未检查转换
- `unused`：未使用的变量
- `deprecation`：使用已废弃的API
- `rawtypes`：使用原始类型

#### @SafeVarargs
```java
public class VarargsExample {
    @SafeVarargs
    public static <T> void printAll(T... items) {
        for (T item : items) {
            System.out.println(item);
        }
    }
}
```

### 5.2 函数式接口注解

#### @FunctionalInterface 详细解释

`@FunctionalInterface`注解用来标记一个接口是**函数式接口**，这是Java 8引入Lambda表达式后的重要概念。

##### 什么是函数式接口？
函数式接口是**只有一个抽象方法**的接口，它可以被Lambda表达式实现。

```java
@FunctionalInterface
public interface Calculator {
    // 只能有一个抽象方法（核心要求）
    int calculate(int a, int b);
    
    // 可以有默认方法（不算抽象方法）
    default void log() {
        System.out.println("计算完成");
    }
    
    // 可以有静态方法（不算抽象方法）
    static void info() {
        System.out.println("这是一个计算器接口");
    }
}
```

##### Lambda表达式实现
传统方式 vs Lambda方式的对比：

```java
// ❌ 传统方式：使用匿名内部类
Calculator add = new Calculator() {
    @Override
    public int calculate(int a, int b) {
        return a + b;
    }
};

// ✅ Lambda方式：简洁明了
Calculator add = (a, b) -> a + b;
Calculator multiply = (a, b) -> a * b;
Calculator subtract = (a, b) -> a - b;

// 使用示例
int result1 = add.calculate(5, 3);        // 结果：8
int result2 = multiply.calculate(4, 6);   // 结果：24
int result3 = subtract.calculate(10, 4);  // 结果：6
```

##### Lambda表达式语法详解

```java
// 完整语法：(参数列表) -> { 方法体 }
Calculator complex = (int a, int b) -> {
    System.out.println("正在计算: " + a + " + " + b);
    int result = a + b;
    return result;
};

// 简化语法：参数类型可以省略（类型推断）
Calculator simple = (a, b) -> a + b;

// 单参数可以省略括号
Function<Integer, Integer> square = x -> x * x;

// 无参数必须保留空括号
Supplier<String> greeting = () -> "Hello World";

// 单条语句可以省略大括号和return
Calculator add = (a, b) -> a + b;

// 多条语句必须使用大括号和return
Calculator verbose = (a, b) -> {
    System.out.println("开始计算");
    return a + b;
};
```

##### 常见的函数式接口

Java提供了许多内置的函数式接口：

```java
// 1. Supplier<T> - 供应商：无参数，返回T类型
Supplier<String> stringSupplier = () -> "Hello";
Supplier<Integer> randomNum = () -> new Random().nextInt(100);

// 2. Consumer<T> - 消费者：接受T类型参数，无返回值
Consumer<String> printer = str -> System.out.println(str);
Consumer<Integer> logger = num -> System.out.println("数字：" + num);

// 3. Function<T, R> - 函数：接受T类型，返回R类型
Function<String, Integer> stringLength = str -> str.length();
Function<Integer, String> intToString = num -> "数字：" + num;

// 4. Predicate<T> - 断言：接受T类型，返回boolean
Predicate<String> isEmpty = str -> str.isEmpty();
Predicate<Integer> isEven = num -> num % 2 == 0;

// 5. BiFunction<T, U, R> - 双参数函数：接受T和U，返回R
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
BiFunction<String, String, String> concat = (s1, s2) -> s1 + s2;
```

##### 实际应用示例

```java
public class CalculatorDemo {
    public static void main(String[] args) {
        // 定义不同的计算方式
        Calculator add = (a, b) -> a + b;
        Calculator multiply = (a, b) -> a * b;
        Calculator max = (a, b) -> Math.max(a, b);
        
        // 使用计算器
        performCalculation(10, 5, add);      // 输出：结果：15
        performCalculation(10, 5, multiply); // 输出：结果：50
        performCalculation(10, 5, max);      // 输出：结果：10
        
        // 集合操作中使用Lambda
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        
        // 过滤偶数
        List<Integer> evenNumbers = numbers.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
        
        // 平方运算
        List<Integer> squares = numbers.stream()
            .map(n -> n * n)
            .collect(Collectors.toList());
        
        // 求和
        int sum = numbers.stream()
            .reduce(0, (a, b) -> a + b);
    }
    
    // 高阶函数：接受函数作为参数
    public static void performCalculation(int a, int b, Calculator calc) {
        int result = calc.calculate(a, b);
        System.out.println("结果：" + result);
        calc.log(); // 调用默认方法
    }
}
```

##### @FunctionalInterface注解的作用

1. **编译时检查**：确保接口只有一个抽象方法
```java
@FunctionalInterface
public interface InvalidInterface {
    void method1();
    void method2(); // 编译错误！函数式接口只能有一个抽象方法
}
```

2. **文档说明**：明确表示这是一个函数式接口
3. **IDE支持**：开发工具可以提供更好的Lambda支持

##### 与传统接口的区别

```java
// 传统接口 - 可能有多个抽象方法
public interface TraditionalInterface {
    void method1();
    void method2();
    void method3();
}

// 函数式接口 - 只有一个抽象方法
@FunctionalInterface
public interface FunctionalInterface {
    void singleMethod();
    
    // 可以有默认方法和静态方法
    default void defaultMethod() {}
    static void staticMethod() {}
}
```

##### 方法引用（Method Reference）

Lambda表达式的进一步简化：

```java
// Lambda表达式
Function<String, Integer> lengthLambda = str -> str.length();

// 方法引用（更简洁）
Function<String, Integer> lengthMethodRef = String::length;

// 其他方法引用示例
Consumer<String> printLambda = str -> System.out.println(str);
Consumer<String> printMethodRef = System.out::println;

// 构造器引用
Supplier<ArrayList<String>> listSupplier = ArrayList::new;
```

**总结**：`@FunctionalInterface`让Java支持函数式编程，使代码更简洁、更具表达力。Lambda表达式本质上是匿名函数的简写，让我们可以将行为作为参数传递，这是现代Java编程的重要特性！

## 6. 框架中的常用注解

### 什么是Spring框架？

**Spring**是Java企业级开发中最流行的应用框架，它提供了：
- **依赖注入（DI）**：自动管理对象间的依赖关系
- **面向切面编程（AOP）**：统一处理横切关注点（如日志、事务）
- **事务管理**：简化数据库事务处理
- **Web开发支持**：MVC架构支持

**Spring Boot**是Spring的进化版，它：
- **自动配置**：根据依赖自动配置Spring应用
- **内嵌服务器**：无需外部Tomcat，直接运行
- **简化配置**：减少XML配置，基于注解开发
- **微服务友好**：易于构建独立的微服务应用

### 6.1 Spring核心注解详解

#### 组件注解系列

##### @Component - 通用组件注解
```java
/**
 * @Component: Spring的基础组件注解
 * 功能：告诉Spring这是一个需要管理的Bean（对象）
 * 作用：Spring会自动创建这个类的实例，并放入容器中管理
 */
@Component
public class EmailService {
    public void sendEmail(String to, String message) {
        System.out.println("发送邮件到: " + to);
        System.out.println("内容: " + message);
    }
}

// 可以指定Bean的名称
@Component("customEmailService")
public class CustomEmailService {
    // Spring容器中这个Bean的名称是"customEmailService"
}
```

##### @Service - 业务逻辑层注解
```java
/**
 * @Service: 标记业务逻辑层组件
 * 功能：本质上等同于@Component，但语义更明确
 * 用途：处理业务逻辑、调用数据访问层、实现业务规则
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // 业务方法：创建用户
    public User createUser(String username, String email) {
        // 业务逻辑：验证用户名是否重复
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }
        
        // 创建用户对象
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setCreatedAt(new Date());
        
        // 保存到数据库
        return userRepository.save(user);
    }
    
    // 业务方法：用户登录验证
    public boolean authenticate(String username, String password) {
        User user = userRepository.findByUsername(username);
        return user != null && user.getPassword().equals(password);
    }
}
```

##### @Repository - 数据访问层注解
```java
/**
 * @Repository: 标记数据访问层组件
 * 功能：
 * 1. 等同于@Component，但语义更明确
 * 2. 自动将数据访问异常转换为Spring的DataAccessException
 * 用途：处理数据库操作、文件操作等数据访问逻辑
 */
@Repository
public class UserRepository {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // 数据访问方法：根据ID查找用户
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new Object[]{id}, 
            (rs, rowNum) -> {
                User user = new User();
                user.setId(rs.getLong("id"));
                user.setUsername(rs.getString("username"));
                user.setEmail(rs.getString("email"));
                return user;
            });
    }
    
    // 数据访问方法：保存用户
    public User save(User user) {
        if (user.getId() == null) {
            // 新建用户
            String sql = "INSERT INTO users (username, email, created_at) VALUES (?, ?, ?)";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, user.getUsername());
                ps.setString(2, user.getEmail());
                ps.setTimestamp(3, new Timestamp(user.getCreatedAt().getTime()));
                return ps;
            }, keyHolder);
            user.setId(keyHolder.getKey().longValue());
        } else {
            // 更新用户
            String sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
            jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getId());
        }
        return user;
    }
    
    public boolean existsByUsername(String username) {
        String sql = "SELECT COUNT(*) FROM users WHERE username = ?";
        int count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count > 0;
    }
}
```

##### @Controller - Web控制器注解
```java
/**
 * @Controller: 标记Web控制器组件
 * 功能：处理HTTP请求，返回视图（如JSP、Thymeleaf模板）
 * 用途：传统的MVC架构中的Controller层
 */
@Controller
@RequestMapping("/web")
public class WebController {
    
    @Autowired
    private UserService userService;
    
    // 处理GET请求，返回用户列表页面
    @GetMapping("/users")
    public String listUsers(Model model) {
        List<User> users = userService.getAllUsers();
        model.addAttribute("users", users);
        return "user-list"; // 返回视图名称，对应user-list.html模板
    }
    
    // 处理GET请求，显示用户详情页面
    @GetMapping("/users/{id}")
    public String userDetail(@PathVariable Long id, Model model) {
        User user = userService.findById(id);
        model.addAttribute("user", user);
        return "user-detail"; // 返回user-detail.html模板
    }
    
    // 处理POST请求，创建用户后重定向
    @PostMapping("/users")
    public String createUser(@ModelAttribute User user) {
        userService.createUser(user.getUsername(), user.getEmail());
        return "redirect:/web/users"; // 重定向到用户列表页面
    }
}
```

#### 依赖注入注解

##### @Autowired - 自动装配注解
```java
/**
 * @Autowired: 自动依赖注入注解
 * 功能：Spring自动查找匹配的Bean并注入
 * 原理：按类型（Type）匹配，如果有多个同类型Bean则按名称匹配
 */
@Service
public class OrderService {
    
    // 1. 字段注入（最常用，但不推荐用于测试）
    @Autowired
    private UserService userService;
    
    @Autowired
    private PaymentService paymentService;
    
    // 2. 构造器注入（推荐方式，便于测试和确保依赖不为null）
    private final EmailService emailService;
    private final InventoryService inventoryService;
    
    @Autowired
    public OrderService(EmailService emailService, InventoryService inventoryService) {
        this.emailService = emailService;
        this.inventoryService = inventoryService;
    }
    
    // 3. Setter注入（可选依赖）
    private NotificationService notificationService;
    
    @Autowired(required = false) // required=false表示这个依赖是可选的
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    
    public Order createOrder(Long userId, List<OrderItem> items) {
        // 使用注入的依赖
        User user = userService.findById(userId);
        
        // 检查库存
        for (OrderItem item : items) {
            if (!inventoryService.isAvailable(item.getProductId(), item.getQuantity())) {
                throw new RuntimeException("库存不足");
            }
        }
        
        // 创建订单
        Order order = new Order();
        order.setUser(user);
        order.setItems(items);
        order.setStatus("CREATED");
        
        // 处理支付
        boolean paymentSuccess = paymentService.processPayment(order.getTotalAmount());
        if (paymentSuccess) {
            order.setStatus("PAID");
            
            // 发送邮件通知
            emailService.sendEmail(user.getEmail(), "订单创建成功");
            
            // 可选的通知服务
            if (notificationService != null) {
                notificationService.sendPushNotification(user.getId(), "您的订单已创建");
            }
        }
        
        return order;
    }
}
```

##### @Qualifier - 指定具体Bean
```java
/**
 * @Qualifier: 当有多个同类型Bean时，指定要注入哪一个
 * 场景：一个接口有多个实现类
 */

// 接口
public interface PaymentService {
    boolean processPayment(BigDecimal amount);
}

// 实现类1
@Service("alipayService")
public class AlipayService implements PaymentService {
    public boolean processPayment(BigDecimal amount) {
        System.out.println("使用支付宝支付: " + amount);
        return true;
    }
}

// 实现类2
@Service("wechatPayService")
public class WechatPayService implements PaymentService {
    public boolean processPayment(BigDecimal amount) {
        System.out.println("使用微信支付: " + amount);
        return true;
    }
}

// 使用时指定具体的实现
@Service
public class OrderService {
    
    @Autowired
    @Qualifier("alipayService") // 明确指定使用支付宝服务
    private PaymentService paymentService;
    
    // 或者使用构造器注入
    public OrderService(@Qualifier("wechatPayService") PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}
```

##### @Value - 属性值注入
```java
/**
 * @Value: 注入配置文件中的属性值
 * 功能：从application.properties或application.yml读取配置
 */

// application.properties文件内容：
// app.name=我的应用
// app.version=1.0.0
// database.url=jdbc:mysql://localhost:3306/mydb
// email.smtp.host=smtp.gmail.com
// email.smtp.port=587

@Service
public class ConfigService {
    
    // 注入简单属性值
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.version}")
    private String appVersion;
    
    // 注入数字类型
    @Value("${email.smtp.port}")
    private int smtpPort;
    
    // 提供默认值（如果配置文件中没有该属性）
    @Value("${app.debug:false}") // 默认值为false
    private boolean debugMode;
    
    @Value("${app.max-users:1000}") // 默认值为1000
    private int maxUsers;
    
    // 注入系统属性
    @Value("${java.version}")
    private String javaVersion;
    
    // 注入环境变量
    @Value("${HOME}") // Unix/Linux系统的HOME环境变量
    private String homeDirectory;
    
    public void printConfig() {
        System.out.println("应用名称: " + appName);
        System.out.println("应用版本: " + appVersion);
        System.out.println("SMTP端口: " + smtpPort);
        System.out.println("调试模式: " + debugMode);
        System.out.println("最大用户数: " + maxUsers);
        System.out.println("Java版本: " + javaVersion);
        System.out.println("主目录: " + homeDirectory);
    }
}
```

### 6.2 Spring Boot注解详解

##### @SpringBootApplication - 启动类注解
```java
/**
 * @SpringBootApplication: Spring Boot应用的核心注解
 * 功能：这是一个组合注解，等价于以下三个注解的组合：
 * 1. @Configuration: 标记这是一个配置类
 * 2. @EnableAutoConfiguration: 启用Spring Boot的自动配置
 * 3. @ComponentScan: 启用组件扫描
 */

@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(MyApplication.class, args);
        
        /*
         * 这一行代码会：
         * 1. 创建Spring应用上下文
         * 2. 扫描当前包及子包中的@Component、@Service等注解
         * 3. 根据classpath中的依赖自动配置Bean
         * 4. 启动内嵌的Web服务器（如Tomcat）
         * 5. 部署应用到服务器上
         */
    }
}

// 如果需要自定义配置，可以分别使用：
@Configuration
@EnableAutoConfiguration
@ComponentScan(basePackages = {"com.example.service", "com.example.repository"})
public class CustomApplication {
    // 自定义配置
}
```

##### REST API注解系列

##### @RestController - REST控制器注解
```java
/**
 * @RestController: REST API控制器注解
 * 功能：等价于 @Controller + @ResponseBody
 * 特点：方法返回的对象会自动转换为JSON格式返回给客户端
 * 用途：构建RESTful Web服务
 */
@RestController
@RequestMapping("/api/v1") // 基础路径
public class UserRestController {
    
    @Autowired
    private UserService userService;
    
    /**
     * GET /api/v1/users - 获取所有用户
     * 返回JSON格式的用户列表
     */
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.getAllUsers();
        // Spring会自动将List<User>转换为JSON数组返回
    }
    
    /**
     * GET /api/v1/users/123 - 根据ID获取用户
     * @PathVariable: 从URL路径中提取参数
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        try {
            User user = userService.findById(id);
            return ResponseEntity.ok(user); // 返回200状态码和用户数据
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build(); // 返回404状态码
        }
    }
    
    /**
     * POST /api/v1/users - 创建新用户
     * @RequestBody: 将请求体中的JSON转换为Java对象
     */
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest request) {
        try {
            User user = userService.createUser(request.getUsername(), request.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(user); // 返回201状态码
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build(); // 返回400状态码
        }
    }
    
    /**
     * PUT /api/v1/users/123 - 更新用户信息
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, 
                                         @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUser(id, request.getUsername(), request.getEmail());
            return ResponseEntity.ok(user);
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * DELETE /api/v1/users/123 - 删除用户
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build(); // 返回204状态码
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /api/v1/users?page=0&size=10&sort=username - 分页查询
     * @RequestParam: 从URL查询参数中提取值
     */
    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort) {
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sort));
        Page<User> users = userService.getUsers(pageRequest);
        return ResponseEntity.ok(users);
    }
}
```

##### HTTP方法映射注解详解
```java
/**
 * HTTP方法映射注解详解
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {
    
    /**
     * @GetMapping: 处理GET请求
     * 用途：获取资源，不会修改服务器状态
     * 特点：幂等（多次调用结果相同）、可缓存
     */
    @GetMapping // 等价于 @RequestMapping(method = RequestMethod.GET)
    public List<Product> getAllProducts() {
        return productService.findAll();
    }
    
    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productService.findById(id);
    }
    
    /**
     * @PostMapping: 处理POST请求
     * 用途：创建新资源
     * 特点：非幂等（多次调用可能产生不同结果）
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product created = productService.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * @PutMapping: 处理PUT请求
     * 用途：完整更新资源（替换整个资源）
     * 特点：幂等
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, 
                                               @RequestBody Product product) {
        product.setId(id);
        Product updated = productService.save(product);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * @PatchMapping: 处理PATCH请求
     * 用途：部分更新资源（只更新指定字段）
     * 特点：幂等
     */
    @PatchMapping("/{id}")
    public ResponseEntity<Product> patchProduct(@PathVariable Long id, 
                                              @RequestBody Map<String, Object> updates) {
        Product updated = productService.partialUpdate(id, updates);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * @DeleteMapping: 处理DELETE请求
     * 用途：删除资源
     * 特点：幂等
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

##### 参数绑定注解详解
```java
@RestController
@RequestMapping("/api/search")
public class SearchController {
    
    /**
     * @PathVariable: 从URL路径中提取变量
     * URL示例: /api/search/users/123/orders/456
     */
    @GetMapping("/users/{userId}/orders/{orderId}")
    public Order getUserOrder(@PathVariable Long userId, 
                            @PathVariable Long orderId) {
        return orderService.findByUserIdAndOrderId(userId, orderId);
    }
    
    // 路径变量名称与参数名不同时
    @GetMapping("/products/{productId}")
    public Product getProduct(@PathVariable("productId") Long id) {
        return productService.findById(id);
    }
    
    /**
     * @RequestParam: 从URL查询参数中提取值
     * URL示例: /api/search/products?keyword=手机&category=电子&minPrice=1000&maxPrice=5000
     */
    @GetMapping("/products")
    public List<Product> searchProducts(
            @RequestParam String keyword,                    // 必需参数
            @RequestParam(required = false) String category, // 可选参数
            @RequestParam(defaultValue = "0") BigDecimal minPrice, // 有默认值
            @RequestParam(defaultValue = "999999") BigDecimal maxPrice) {
        
        return productService.search(keyword, category, minPrice, maxPrice);
    }
    
    /**
     * @RequestHeader: 从HTTP请求头中提取值
     */
    @GetMapping("/secure-data")
    public ResponseEntity<String> getSecureData(
            @RequestHeader("Authorization") String authToken,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(defaultValue = "application/json") String accept) {
        
        if (!isValidToken(authToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        return ResponseEntity.ok("安全数据");
    }
    
    /**
     * @RequestBody: 将请求体内容绑定到对象
     * 常用于POST/PUT请求，自动将JSON转换为Java对象
     */
    @PostMapping("/users")
    public User createUser(@RequestBody CreateUserRequest request) {
        // Spring自动将请求体中的JSON转换为CreateUserRequest对象
        return userService.createUser(request);
    }
    
    /**
     * @ModelAttribute: 将请求参数绑定到对象（适用于表单提交）
     * 适用于传统的表单提交，参数以key=value形式提交
     */
    @PostMapping("/users/form")
    public String createUserForm(@ModelAttribute User user, Model model) {
        User created = userService.save(user);
        model.addAttribute("user", created);
        return "user-created"; // 返回视图名称
    }
}
```

#### REST API完整示例
```java
/**
 * 完整的REST API示例：用户管理
 * 展示了标准的RESTful设计模式
 */
@RestController
@RequestMapping("/api/v1/users")
@Validated // 启用参数验证
public class UserApiController {
    
    @Autowired
    private UserService userService;
    
    // GET /api/v1/users - 获取用户列表（支持分页和搜索）
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search) {
        
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? 
                                     Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        Page<UserDto> users = userService.findUsers(search, pageable);
        
        ApiResponse<Page<UserDto>> response = ApiResponse.<Page<UserDto>>builder()
            .success(true)
            .message("用户列表获取成功")
            .data(users)
            .timestamp(LocalDateTime.now())
            .build();
            
        return ResponseEntity.ok(response);
    }
    
    // GET /api/v1/users/123 - 获取单个用户
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable Long id) {
        try {
            UserDto user = userService.findById(id);
            return ResponseEntity.ok(ApiResponse.success("用户信息获取成功", user));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("用户不存在", null));
        }
    }
    
    // POST /api/v1/users - 创建用户
    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        try {
            UserDto user = userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("用户创建成功", user));
        } catch (DuplicateUsernameException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("用户名已存在", null));
        }
    }
    
    // PUT /api/v1/users/123 - 更新用户
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            UserDto user = userService.updateUser(id, request);
            return ResponseEntity.ok(ApiResponse.success("用户更新成功", user));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("用户不存在", null));
        }
    }
    
    // DELETE /api/v1/users/123 - 删除用户
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(ApiResponse.success("用户删除成功", null));
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("用户不存在", null));
        }
    }
    
    // POST /api/v1/users/123/avatar - 上传用户头像
    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            String avatarUrl = userService.uploadAvatar(id, file);
            return ResponseEntity.ok(ApiResponse.success("头像上传成功", avatarUrl));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("头像上传失败", null));
        }
    }
}

// 统一的API响应格式
@Data
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    public static <T> ApiResponse<T> error(String message, T data) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
```

### 6.3 JPA/Hibernate注解详解

**JPA（Java Persistence API）**是Java的数据持久化标准，**Hibernate**是JPA的最流行实现。这些注解用于将Java对象映射到数据库表。

#### 核心实体注解

##### @Entity - 实体类注解
```java
/**
 * @Entity: 标记这是一个JPA实体类
 * 功能：告诉JPA这个类对应数据库中的一张表
 * 要求：
 * 1. 必须有一个无参构造器
 * 2. 必须有一个主键字段（用@Id标记）
 * 3. 字段不能是final的
 */
@Entity
@Table(name = "users") // 可选：指定数据库表名，不指定则使用类名
public class User {
    
    @Id // 标记主键字段
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 主键生成策略
    private Long id;
    
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // 必须有无参构造器
    public User() {}
    
    public User(String username, String email) {
        this.username = username;
        this.email = email;
        this.createdAt = LocalDateTime.now();
    }
    
    // getter和setter方法...
}
```

##### @Table - 表映射注解
```java
/**
 * @Table: 指定实体对应的数据库表的详细信息
 */
@Entity
@Table(
    name = "user_profiles",           // 表名
    catalog = "myapp_db",            // 数据库名（可选）
    schema = "public",               // 模式名（可选）
    uniqueConstraints = {            // 唯一约束
        @UniqueConstraint(
            name = "uk_user_email", 
            columnNames = {"user_id", "email"}
        )
    },
    indexes = {                      // 索引
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_created", columnList = "created_at")
    }
)
public class UserProfile {
    // 字段定义...
}
```

##### @Id 和主键生成策略
```java
@Entity
public class Product {
    
    /**
     * @Id: 标记主键字段
     * @GeneratedValue: 主键值生成策略
     */
    
    // 策略1: AUTO - 让JPA自动选择合适的策略
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    // 策略2: IDENTITY - 使用数据库的自增字段（MySQL的AUTO_INCREMENT）
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 策略3: SEQUENCE - 使用数据库序列（Oracle、PostgreSQL）
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq")
    @SequenceGenerator(name = "product_seq", sequenceName = "product_sequence", allocationSize = 1)
    private Long id;
    
    // 策略4: TABLE - 使用单独的表来生成主键
    @Id
    @GeneratedValue(strategy = GenerationType.TABLE, generator = "product_gen")
    @TableGenerator(name = "product_gen", table = "id_generator", 
                   pkColumnName = "gen_name", valueColumnName = "gen_value",
                   pkColumnValue = "product_id", allocationSize = 1)
    private Long id;
    
    // 复合主键：使用@IdClass或@EmbeddedId
    // 方式1: @IdClass
    @Id
    private Long userId;
    @Id
    private Long productId;
    
    // 字段定义...
}

// 复合主键类
@IdClass(UserProductId.class)
@Entity
public class UserProduct {
    @Id
    private Long userId;
    @Id
    private Long productId;
    private Integer quantity;
    // ...
}

// 主键类必须实现Serializable
public class UserProductId implements Serializable {
    private Long userId;
    private Long productId;
    
    // 必须重写equals和hashCode
    @Override
    public boolean equals(Object o) { /* ... */ }
    
    @Override
    public int hashCode() { /* ... */ }
}
```

##### @Column - 字段映射注解
```java
@Entity
public class User {
    
    /**
     * @Column: 指定字段映射到数据库列的详细信息
     */
    
    // 基本用法
    @Column(name = "user_name")  // 指定数据库列名
    private String username;
    
    // 详细配置
    @Column(
        name = "email_address",      // 列名
        nullable = false,            // 不能为null（相当于NOT NULL约束）
        unique = true,              // 唯一约束
        length = 255,               // 字符串长度（varchar(255)）
        columnDefinition = "TEXT"   // 自定义列定义
    )
    private String email;
    
    // 数字类型配置
    @Column(
        name = "salary",
        precision = 10,  // 总位数
        scale = 2        // 小数位数（decimal(10,2)）
    )
    private BigDecimal salary;
    
    // 不需要映射到数据库的字段
    @Transient
    private String tempPassword; // 这个字段不会保存到数据库
    
    // 时间类型
    @Column(name = "birth_date")
    @Temporal(TemporalType.DATE)      // 只保存日期部分
    private Date birthDate;
    
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP) // 保存日期和时间
    private Date createdAt;
    
    @Column(name = "login_time")
    @Temporal(TemporalType.TIME)      // 只保存时间部分
    private Date loginTime;
    
    // 枚举类型
    @Enumerated(EnumType.STRING)      // 保存枚举的字符串值
    private UserStatus status;        // 如：ACTIVE, INACTIVE, BANNED
    
    @Enumerated(EnumType.ORDINAL)     // 保存枚举的序号值
    private UserRole role;            // 如：0, 1, 2
    
    // 大对象类型
    @Lob  // Large Object：用于存储大文本或二进制数据
    @Column(name = "profile_photo")
    private byte[] photo;             // 存储图片
    
    @Lob
    @Column(name = "description")
    private String description;       // 存储长文本
}

// 枚举类型示例
public enum UserStatus {
    ACTIVE, INACTIVE, BANNED, SUSPENDED
}

public enum UserRole {
    USER, ADMIN, MODERATOR
}
```

#### 关联关系注解

##### @OneToOne - 一对一关系
```java
/**
 * 一对一关系：一个用户对应一个用户详情
 */

// 主表（拥有外键的一方）
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    /**
     * @OneToOne: 一对一关系
     * @JoinColumn: 指定外键列
     */
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", referencedColumnName = "id")
    private UserProfile profile;
    
    // 构造器、getter、setter...
}

// 从表
@Entity
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String firstName;
    private String lastName;
    private String bio;
    private String avatarUrl;
    
    // 双向关联：从UserProfile也能访问User
    @OneToOne(mappedBy = "profile") // mappedBy指向User类中的profile字段
    private User user;
    
    // 构造器、getter、setter...
}

// 使用示例
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public User createUserWithProfile(String username, String firstName, String lastName) {
        // 创建用户详情
        UserProfile profile = new UserProfile();
        profile.setFirstName(firstName);
        profile.setLastName(lastName);
        
        // 创建用户
        User user = new User();
        user.setUsername(username);
        user.setProfile(profile);
        
        // 设置双向关联
        profile.setUser(user);
        
        // 由于设置了cascade = CascadeType.ALL，保存user时会自动保存profile
        return userRepository.save(user);
    }
}
```

##### @OneToMany - 一对多关系
```java
/**
 * 一对多关系：一个用户可以有多个订单
 */

// "一"的一方：User
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    /**
     * @OneToMany: 一对多关系
     * mappedBy: 指向Order类中的user字段（表示外键在Order表中）
     * cascade: 级联操作（保存用户时自动处理订单）
     * fetch: 加载策略（LAZY表示需要时才加载订单列表）
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
    
    // 便利方法：添加订单
    public void addOrder(Order order) {
        orders.add(order);
        order.setUser(this); // 设置双向关联
    }
    
    // 便利方法：移除订单
    public void removeOrder(Order order) {
        orders.remove(order);
        order.setUser(null);
    }
}

// "多"的一方：Order
@Entity
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private BigDecimal totalAmount;
    private LocalDateTime orderTime;
    
    /**
     * @ManyToOne: 多对一关系（从Order的角度看，多个订单对应一个用户）
     * @JoinColumn: 指定外键列名
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // 构造器、getter、setter...
}

// 使用示例
@Service
public class OrderService {
    
    public Order createOrder(Long userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("用户不存在"));
        
        Order order = new Order();
        order.setTotalAmount(amount);
        order.setOrderTime(LocalDateTime.now());
        
        // 建立关联关系
        user.addOrder(order);
        
        return orderRepository.save(order);
    }
    
    // 获取用户的所有订单
    public List<Order> getUserOrders(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("用户不存在"));
        
        // 由于使用了LAZY加载，这里会触发数据库查询
        return user.getOrders();
    }
}
```

##### @ManyToMany - 多对多关系
```java
/**
 * 多对多关系：用户和角色的关系（一个用户可以有多个角色，一个角色可以分配给多个用户）
 */

// 主控方：User
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    /**
     * @ManyToMany: 多对多关系
     * @JoinTable: 指定中间表的信息
     */
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_roles",                    // 中间表名
        joinColumns = @JoinColumn(name = "user_id"),     // 当前实体的外键列
        inverseJoinColumns = @JoinColumn(name = "role_id") // 关联实体的外键列
    )
    private Set<Role> roles = new HashSet<>();
    
    // 便利方法：添加角色
    public void addRole(Role role) {
        roles.add(role);
        role.getUsers().add(this);
    }
    
    // 便利方法：移除角色
    public void removeRole(Role role) {
        roles.remove(role);
        role.getUsers().remove(this);
    }
}

// 被控方：Role
@Entity
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name; // ADMIN, USER, MODERATOR等
    private String description;
    
    /**
     * mappedBy: 指向User类中的roles字段，表示这是关系的被控方
     */
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
    
    // 构造器、getter、setter...
}

// 带额外信息的多对多关系：用户和课程的关系（包含注册时间、成绩等额外信息）
@Entity
public class User {
    @Id
    private Long id;
    private String username;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private Set<UserCourse> userCourses = new HashSet<>();
}

@Entity
public class Course {
    @Id
    private Long id;
    private String name;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private Set<UserCourse> userCourses = new HashSet<>();
}

// 中间实体：包含额外信息
@Entity
@Table(name = "user_courses")
public class UserCourse {
    
    @EmbeddedId
    private UserCourseId id;
    
    @ManyToOne
    @MapsId("userId") // 映射到复合主键的userId部分
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne
    @MapsId("courseId") // 映射到复合主键的courseId部分
    @JoinColumn(name = "course_id")
    private Course course;
    
    // 额外信息
    private LocalDateTime enrollmentDate;
    private BigDecimal grade;
    private String status; // ENROLLED, COMPLETED, DROPPED
    
    // 构造器、getter、setter...
}

// 复合主键
@Embeddable
public class UserCourseId implements Serializable {
    private Long userId;
    private Long courseId;
    
    // 必须重写equals和hashCode
    @Override
    public boolean equals(Object o) { /* ... */ }
    
    @Override
    public int hashCode() { /* ... */ }
}
```

#### 级联操作和获取策略

##### 级联操作（Cascade）
```java
@Entity
public class User {
    
    /**
     * 级联操作类型：
     * CascadeType.PERSIST: 保存用户时，自动保存关联的订单
     * CascadeType.MERGE: 更新用户时，自动更新关联的订单
     * CascadeType.REMOVE: 删除用户时，自动删除关联的订单
     * CascadeType.REFRESH: 刷新用户时，自动刷新关联的订单
     * CascadeType.DETACH: 分离用户时，自动分离关联的订单
     * CascadeType.ALL: 包含所有上述操作
     */
    
    // 删除用户时不会删除订单（业务需要保留订单记录）
    @OneToMany(mappedBy = "user", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Order> orders;
    
    // 删除用户时会删除用户详情（因为详情没有独立存在的意义）
    @OneToOne(cascade = CascadeType.ALL)
    private UserProfile profile;
    
    // 不会删除角色（角色是独立的实体，可能被其他用户使用）
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private Set<Role> roles;
}
```

##### 获取策略（Fetch）
```java
@Entity
public class User {
    
    /**
     * 获取策略：
     * FetchType.LAZY（懒加载）: 需要时才从数据库加载
     * FetchType.EAGER（急加载）: 立即从数据库加载
     */
    
    // 懒加载：获取用户时不立即加载订单列表，只有访问orders时才查询数据库
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Order> orders;
    
    // 急加载：获取用户时立即加载用户详情
    @OneToOne(fetch = FetchType.EAGER)
    private UserProfile profile;
    
    // 默认的获取策略：
    // @OneToOne, @ManyToOne: 默认是EAGER
    // @OneToMany, @ManyToMany: 默认是LAZY
}

// 解决N+1查询问题的方法
@Repository
public class UserRepository extends JpaRepository<User, Long> {
    
    // 使用JOIN FETCH避免N+1问题
    @Query("SELECT u FROM User u JOIN FETCH u.orders WHERE u.id = :id")
    Optional<User> findByIdWithOrders(@Param("id") Long id);
    
    // 使用@EntityGraph
    @EntityGraph(attributePaths = {"orders", "profile"})
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithOrdersAndProfile(@Param("id") Long id);
}
```

#### 完整的JPA实体示例
```java
/**
 * 完整的JPA实体示例：电商系统的订单实体
 */
@Entity
@Table(name = "orders")
@EntityListeners(AuditingEntityListener.class) // 启用审计功能
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;
    
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    @Embedded
    private Address shippingAddress;
    
    // 审计字段
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;
    
    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;
    
    // 生命周期回调方法
    @PrePersist
    protected void onCreate() {
        if (orderNumber == null) {
            orderNumber = generateOrderNumber();
        }
        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        // 更新前的逻辑
    }
    
    private String generateOrderNumber() {
        return "ORD" + System.currentTimeMillis();
    }
    
    // 便利方法
    public void addOrderItem(OrderItem item) {
        orderItems.add(item);
        item.setOrder(this);
    }
    
    public void removeOrderItem(OrderItem item) {
        orderItems.remove(item);
        item.setOrder(null);
    }
    
    // 构造器、getter、setter...
}

// 嵌入式值对象
@Embeddable
public class Address {
    @Column(name = "street")
    private String street;
    
    @Column(name = "city")
    private String city;
    
    @Column(name = "state")
    private String state;
    
    @Column(name = "zip_code")
    private String zipCode;
    
    @Column(name = "country")
    private String country;
    
    // 构造器、getter、setter...
}

// 枚举类型
public enum OrderStatus {
    PENDING("待处理"),
    CONFIRMED("已确认"),
    SHIPPED("已发货"),
    DELIVERED("已送达"),
    CANCELLED("已取消");
    
    private final String description;
    
    OrderStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
```

### 6.4 Bean Validation（数据验证）注解详解

**Bean Validation**是Java的数据验证标准，用于验证Java对象的字段值是否符合预期。Spring Boot默认集成了Hibernate Validator（Bean Validation的实现）。

#### 基础验证注解

##### 空值检查注解
```java
/**
 * 数据验证注解示例：用户注册表单
 */
public class UserRegistrationDto {
    
    /**
     * @NotNull: 值不能为null
     * @NotEmpty: 值不能为null且长度大于0（用于字符串、集合、数组）
     * @NotBlank: 值不能为null、空字符串或只包含空白字符（只用于字符串）
     */
    
    @NotNull(message = "用户名不能为空")
    @NotBlank(message = "用户名不能为空白")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    @NotEmpty(message = "密码不能为空")
    @Size(min = 6, max = 50, message = "密码长度必须在6-50个字符之间")
    private String password;
    
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
    
    @NotNull(message = "邮箱不能为空")
    @NotBlank(message = "邮箱不能为空白")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    // 构造器、getter、setter...
}

// 验证示例
@RestController
@RequestMapping("/api/auth")
@Validated // 启用方法级别的验证
public class AuthController {
    
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody UserRegistrationDto dto) {
        // @Valid 会自动触发验证，如果验证失败会抛出MethodArgumentNotValidException
        
        // 验证通过后的业务逻辑
        userService.registerUser(dto);
        return ResponseEntity.ok("注册成功");
    }
    
    // 方法参数验证
    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsername(
            @RequestParam @NotBlank @Size(min = 3, max = 20) String username) {
        boolean available = userService.isUsernameAvailable(username);
        return ResponseEntity.ok(available);
    }
}
```

##### 数值范围验证注解
```java
public class ProductDto {
    
    @NotBlank(message = "商品名称不能为空")
    @Size(max = 100, message = "商品名称不能超过100个字符")
    private String name;
    
    /**
     * 数值验证注解：
     * @Min: 最小值
     * @Max: 最大值
     * @DecimalMin: 最小小数值
     * @DecimalMax: 最大小数值
     * @Positive: 正数（大于0）
     * @PositiveOrZero: 正数或0
     * @Negative: 负数（小于0）
     * @NegativeOrZero: 负数或0
     */
    
    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.01", message = "价格必须大于0.01")
    @DecimalMax(value = "999999.99", message = "价格不能超过999999.99")
    @Digits(integer = 6, fraction = 2, message = "价格格式不正确，最多6位整数和2位小数")
    private BigDecimal price;
    
    @Min(value = 0, message = "库存数量不能为负数")
    @Max(value = 10000, message = "库存数量不能超过10000")
    private Integer stockQuantity;
    
    @Positive(message = "重量必须为正数")
    private Double weight;
    
    @PositiveOrZero(message = "折扣不能为负数")
    @DecimalMax(value = "1.0", message = "折扣不能超过1.0")
    private BigDecimal discount;
    
    // 构造器、getter、setter...
}
```

##### 字符串格式验证注解
```java
public class ContactDto {
    
    /**
     * 字符串格式验证注解：
     * @Email: 邮箱格式
     * @Pattern: 正则表达式匹配
     * @Size: 字符串长度
     */
    
    @NotBlank(message = "姓名不能为空")
    @Size(min = 2, max = 50, message = "姓名长度必须在2-50个字符之间")
    @Pattern(regexp = "^[\\u4e00-\\u9fa5a-zA-Z\\s]+$", message = "姓名只能包含中文、英文字母和空格")
    private String name;
    
    @Email(message = "邮箱格式不正确")
    @NotBlank(message = "邮箱不能为空")
    private String email;
    
    // 中国手机号验证
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    @NotBlank(message = "手机号不能为空")
    private String phoneNumber;
    
    // 身份证号验证
    @Pattern(regexp = "^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$", 
             message = "身份证号格式不正确")
    private String idCard;
    
    // URL验证
    @Pattern(regexp = "^https?://.+", message = "网址格式不正确")
    private String website;
    
    // 邮政编码验证
    @Pattern(regexp = "^\\d{6}$", message = "邮政编码必须是6位数字")
    private String zipCode;
    
    // 构造器、getter、setter...
}
```

##### 时间日期验证注解
```java
public class EventDto {
    
    @NotBlank(message = "活动名称不能为空")
    private String name;
    
    /**
     * 时间验证注解：
     * @Past: 过去的时间
     * @PastOrPresent: 过去或现在的时间
     * @Future: 未来的时间
     * @FutureOrPresent: 未来或现在的时间
     */
    
    @NotNull(message = "生日不能为空")
    @Past(message = "生日必须是过去的日期")
    private LocalDate birthday;
    
    @NotNull(message = "开始时间不能为空")
    @FutureOrPresent(message = "开始时间不能早于当前时间")
    private LocalDateTime startTime;
    
    @NotNull(message = "结束时间不能为空")
    @Future(message = "结束时间必须是未来的时间")
    private LocalDateTime endTime;
    
    @PastOrPresent(message = "创建时间不能是未来时间")
    private LocalDateTime createdAt;
    
    // 构造器、getter、setter...
}
```

#### 高级验证功能

##### 自定义验证注解
```java
/**
 * 自定义验证注解：密码强度验证
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface ValidPassword {
    String message() default "密码强度不够：至少8位，包含大小写字母、数字和特殊字符";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 验证器实现
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    
    private Pattern pattern;
    
    @Override
    public void initialize(ValidPassword constraintAnnotation) {
        pattern = Pattern.compile(PASSWORD_PATTERN);
    }
    
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) {
            return false;
        }
        
        Matcher matcher = pattern.matcher(password);
        if (!matcher.matches()) {
            // 自定义错误消息
            context.disableDefaultConstraintViolation();
            
            List<String> errors = new ArrayList<>();
            if (password.length() < 8) {
                errors.add("密码长度至少8位");
            }
            if (!password.matches(".*[a-z].*")) {
                errors.add("必须包含小写字母");
            }
            if (!password.matches(".*[A-Z].*")) {
                errors.add("必须包含大写字母");
            }
            if (!password.matches(".*\\d.*")) {
                errors.add("必须包含数字");
            }
            if (!password.matches(".*[@$!%*?&].*")) {
                errors.add("必须包含特殊字符(@$!%*?&)");
            }
            
            String errorMessage = "密码要求：" + String.join("、", errors);
            context.buildConstraintViolationWithTemplate(errorMessage)
                   .addConstraintViolation();
            
            return false;
        }
        
        return true;
    }
}

// 使用自定义验证注解
public class ChangePasswordDto {
    
    @NotBlank(message = "当前密码不能为空")
    private String currentPassword;
    
    @ValidPassword // 使用自定义验证注解
    @NotBlank(message = "新密码不能为空")
    private String newPassword;
    
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
    
    // 构造器、getter、setter...
}
```

##### 类级别验证（跨字段验证）
```java
/**
 * 类级别验证注解：确保两个字段相等
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = FieldMatchValidator.class)
@Documented
public @interface FieldMatch {
    String message() default "字段不匹配";
    String first();
    String second();
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 验证器实现
public class FieldMatchValidator implements ConstraintValidator<FieldMatch, Object> {
    
    private String firstFieldName;
    private String secondFieldName;
    
    @Override
    public void initialize(FieldMatch constraintAnnotation) {
        firstFieldName = constraintAnnotation.first();
        secondFieldName = constraintAnnotation.second();
    }
    
    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        try {
            Object firstObj = getFieldValue(value, firstFieldName);
            Object secondObj = getFieldValue(value, secondFieldName);
            
            boolean valid = Objects.equals(firstObj, secondObj);
            
            if (!valid) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(
                    String.format("%s和%s必须相同", firstFieldName, secondFieldName))
                       .addPropertyNode(secondFieldName)
                       .addConstraintViolation();
            }
            
            return valid;
        } catch (Exception e) {
            return false;
        }
    }
    
    private Object getFieldValue(Object object, String fieldName) throws Exception {
        Class<?> clazz = object.getClass();
        Field field = clazz.getDeclaredField(fieldName);
        field.setAccessible(true);
        return field.get(object);
    }
}

// 使用类级别验证
@FieldMatch(first = "password", second = "confirmPassword", message = "密码和确认密码必须相同")
@FieldMatch(first = "email", second = "confirmEmail", message = "邮箱和确认邮箱必须相同")
public class UserRegistrationDto {
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    @ValidPassword
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
    
    @Email(message = "邮箱格式不正确")
    @NotBlank(message = "邮箱不能为空")
    private String email;
    
    @NotBlank(message = "确认邮箱不能为空")
    private String confirmEmail;
    
    // 构造器、getter、setter...
}
```

##### 验证组（Validation Groups）
```java
/**
 * 验证组：在不同场景下应用不同的验证规则
 */

// 定义验证组接口
public interface CreateGroup {}
public interface UpdateGroup {}

public class UserDto {
    
    // ID只在更新时需要
    @NotNull(groups = UpdateGroup.class, message = "更新时ID不能为空")
    @Null(groups = CreateGroup.class, message = "创建时ID必须为空")
    private Long id;
    
    // 用户名在创建和更新时都需要验证
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class}, message = "用户名不能为空")
    @Size(min = 3, max = 20, groups = {CreateGroup.class, UpdateGroup.class}, 
          message = "用户名长度必须在3-20个字符之间")
    private String username;
    
    // 密码只在创建时需要
    @NotBlank(groups = CreateGroup.class, message = "创建时密码不能为空")
    @ValidPassword(groups = CreateGroup.class)
    private String password;
    
    // 邮箱在创建和更新时都需要验证
    @Email(groups = {CreateGroup.class, UpdateGroup.class}, message = "邮箱格式不正确")
    @NotBlank(groups = {CreateGroup.class, UpdateGroup.class}, message = "邮箱不能为空")
    private String email;
    
    // 构造器、getter、setter...
}

// 在控制器中使用验证组
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ResponseEntity<User> createUser(@Validated(CreateGroup.class) @RequestBody UserDto dto) {
        // 只验证CreateGroup组的注解
        User user = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, 
                                         @Validated(UpdateGroup.class) @RequestBody UserDto dto) {
        // 只验证UpdateGroup组的注解
        dto.setId(id);
        User user = userService.updateUser(dto);
        return ResponseEntity.ok(user);
    }
}
```

##### 全局异常处理
```java
/**
 * 全局异常处理：统一处理验证错误
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 处理@Valid验证失败的异常（请求体验证）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex) {
        
        ValidationErrorResponse errorResponse = new ValidationErrorResponse();
        errorResponse.setMessage("请求参数验证失败");
        errorResponse.setTimestamp(LocalDateTime.now());
        
        // 收集所有验证错误
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });
        
        // 收集类级别验证错误
        ex.getBindingResult().getGlobalErrors().forEach(error -> {
            errors.put(error.getObjectName(), error.getDefaultMessage());
        });
        
        errorResponse.setErrors(errors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
    
    /**
     * 处理@Validated验证失败的异常（方法参数验证）
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex) {
        
        ValidationErrorResponse errorResponse = new ValidationErrorResponse();
        errorResponse.setMessage("参数验证失败");
        errorResponse.setTimestamp(LocalDateTime.now());
        
        Map<String, String> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String propertyPath = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            errors.put(propertyPath, message);
        });
        
        errorResponse.setErrors(errors);
        
        return ResponseEntity.badRequest().body(errorResponse);
    }
}

// 验证错误响应类
@Data
public class ValidationErrorResponse {
    private String message;
    private LocalDateTime timestamp;
    private Map<String, String> errors;
}
```

### 6.5 测试注解详解（JUnit 5 + Spring Boot Test）

**JUnit 5**是Java的标准测试框架，**Spring Boot Test**提供了Spring应用的测试支持。

#### JUnit 5 核心注解

##### 基础测试注解
```java
/**
 * JUnit 5 基础测试示例
 */
class CalculatorTest {
    
    private Calculator calculator;
    
    /**
     * @BeforeAll: 在所有测试方法之前执行一次（必须是static方法）
     * 用途：初始化昂贵的资源，如数据库连接池、文件读取等
     */
    @BeforeAll
    static void setUpClass() {
        System.out.println("初始化测试类资源");
        // 例如：初始化数据库连接池
        // DatabasePool.initialize();
    }
    
    /**
     * @AfterAll: 在所有测试方法之后执行一次（必须是static方法）
     * 用途：清理昂贵的资源
     */
    @AfterAll
    static void tearDownClass() {
        System.out.println("清理测试类资源");
        // 例如：关闭数据库连接池
        // DatabasePool.close();
    }
    
    /**
     * @BeforeEach: 在每个测试方法之前执行
     * 用途：为每个测试创建干净的环境
     */
    @BeforeEach
    void setUp() {
        calculator = new Calculator();
        System.out.println("为测试方法准备Calculator实例");
    }
    
    /**
     * @AfterEach: 在每个测试方法之后执行
     * 用途：清理每个测试产生的副作用
     */
    @AfterEach
    void tearDown() {
        calculator = null;
        System.out.println("清理Calculator实例");
    }
    
    /**
     * @Test: 标记这是一个测试方法
     * @DisplayName: 为测试提供可读的名称（在测试报告中显示）
     */
    @Test
    @DisplayName("测试两个正数相加")
    void testAddPositiveNumbers() {
        // Given（准备）
        int a = 5;
        int b = 3;
        int expected = 8;
        
        // When（执行）
        int actual = calculator.add(a, b);
        
        // Then（验证）
        assertEquals(expected, actual, "5 + 3 应该等于 8");
    }
    
    @Test
    @DisplayName("测试除法操作")
    void testDivision() {
        assertEquals(2.0, calculator.divide(10, 5), 0.001, "10 / 5 应该等于 2.0");
    }
    
    /**
     * @Test注解的异常测试
     */
    @Test
    @DisplayName("测试除零异常")
    void testDivisionByZero() {
        // 验证是否抛出预期的异常
        ArithmeticException exception = assertThrows(
            ArithmeticException.class, 
            () -> calculator.divide(10, 0),
            "除零应该抛出ArithmeticException"
        );
        
        // 验证异常消息
        assertEquals("/ by zero", exception.getMessage());
    }
    
    /**
     * @Disabled: 禁用测试（类似于JUnit 4的@Ignore）
     */
    @Test
    @Disabled("暂时禁用，等待修复bug #123")
    void testComplexCalculation() {
        // 这个测试不会执行
    }
}
```

##### 参数化测试注解
```java
/**
 * 参数化测试：使用不同的参数运行同一个测试
 */
class ParameterizedTestExample {
    
    /**
     * @ParameterizedTest: 参数化测试
     * @ValueSource: 提供简单类型的参数值
     */
    @ParameterizedTest
    @DisplayName("测试字符串长度验证")
    @ValueSource(strings = {"", "   ", "test", "hello world"})
    void testStringLength(String input) {
        if (input.trim().isEmpty()) {
            assertTrue(input.trim().length() == 0);
        } else {
            assertTrue(input.length() > 0);
        }
    }
    
    @ParameterizedTest
    @DisplayName("测试数字是否为偶数")
    @ValueSource(ints = {2, 4, 6, 8, 10})
    void testEvenNumbers(int number) {
        assertTrue(number % 2 == 0, number + " 应该是偶数");
    }
    
    /**
     * @CsvSource: 提供CSV格式的参数
     */
    @ParameterizedTest
    @DisplayName("测试加法运算")
    @CsvSource({
        "1, 2, 3",
        "5, 7, 12", 
        "-2, 3, 1",
        "0, 0, 0"
    })
    void testAddition(int a, int b, int expected) {
        Calculator calculator = new Calculator();
        assertEquals(expected, calculator.add(a, b));
    }
    
    /**
     * @CsvFileSource: 从CSV文件读取参数
     */
    @ParameterizedTest
    @DisplayName("从文件测试用户数据")
    @CsvFileSource(resources = "/test-users.csv", numLinesToSkip = 1)
    void testUserValidation(String username, String email, boolean expectedValid) {
        User user = new User(username, email);
        assertEquals(expectedValid, UserValidator.isValid(user));
    }
    
    /**
     * @MethodSource: 使用方法提供参数
     */
    @ParameterizedTest
    @DisplayName("测试密码强度")
    @MethodSource("providePasswordTestCases")
    void testPasswordStrength(String password, boolean expectedStrong) {
        assertEquals(expectedStrong, PasswordValidator.isStrong(password));
    }
    
    // 提供测试参数的静态方法
    static Stream<Arguments> providePasswordTestCases() {
        return Stream.of(
            Arguments.of("123456", false),
            Arguments.of("Password123!", true),
            Arguments.of("weakpass", false),
            Arguments.of("Strong@Pass123", true)
        );
    }
    
    /**
     * @EnumSource: 使用枚举值作为参数
     */
    @ParameterizedTest
    @DisplayName("测试用户状态")
    @EnumSource(UserStatus.class)
    void testUserStatus(UserStatus status) {
        assertNotNull(status);
        assertNotNull(status.getDescription());
    }
    
    /**
     * @ArgumentsSource: 使用自定义参数提供者
     */
    @ParameterizedTest
    @DisplayName("测试自定义参数")
    @ArgumentsSource(CustomArgumentsProvider.class)
    void testWithCustomProvider(String input, int expectedLength) {
        assertEquals(expectedLength, input.length());
    }
}

// 自定义参数提供者
class CustomArgumentsProvider implements ArgumentsProvider {
    @Override
    public Stream<? extends Arguments> provideArguments(ExtensionContext context) {
        return Stream.of(
            Arguments.of("hello", 5),
            Arguments.of("world", 5),
            Arguments.of("test", 4)
        );
    }
}
```

#### Spring Boot 测试注解

##### 完整应用上下文测试
```java
/**
 * @SpringBootTest: 加载完整的Spring应用上下文
 * 用途：集成测试，测试整个应用的交互
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, // 随机端口启动Web服务器
    properties = {"spring.profiles.active=test"} // 激活test配置文件
)
@TestPropertySource(locations = "classpath:application-test.properties") // 额外的测试配置
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD) // 每个测试后重建上下文
class UserServiceIntegrationTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TestRestTemplate restTemplate; // 用于HTTP请求测试
    
    @LocalServerPort
    private int port; // 获取随机分配的端口号
    
    @Test
    @DisplayName("集成测试：创建用户的完整流程")
    void testCreateUserIntegration() {
        // Given
        String username = "testuser";
        String email = "test@example.com";
        
        // When
        User user = userService.createUser(username, email);
        
        // Then
        assertNotNull(user.getId());
        assertEquals(username, user.getUsername());
        assertEquals(email, user.getEmail());
        
        // 验证数据确实保存到数据库
        Optional<User> savedUser = userRepository.findById(user.getId());
        assertTrue(savedUser.isPresent());
        assertEquals(username, savedUser.get().getUsername());
    }
    
    @Test
    @DisplayName("HTTP接口集成测试")
    void testUserApiEndpoint() {
        // Given
        CreateUserRequest request = new CreateUserRequest("apiuser", "api@example.com");
        
        // When
        ResponseEntity<User> response = restTemplate.postForEntity(
            "http://localhost:" + port + "/api/users",
            request,
            User.class
        );
        
        // Then
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("apiuser", response.getBody().getUsername());
    }
}
```

##### Web层测试
```java
/**
 * @WebMvcTest: 只加载Web层组件（Controller、Filter、WebMvcConfigurer等）
 * 优点：启动速度快，只测试Web层逻辑
 */
@WebMvcTest(UserController.class) // 只加载UserController
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc; // 模拟HTTP请求
    
    @MockBean
    private UserService userService; // 模拟Service层
    
    @Autowired
    private ObjectMapper objectMapper; // JSON序列化工具
    
    @Test
    @DisplayName("测试获取用户API - 成功案例")
    void testGetUser_Success() throws Exception {
        // Given
        Long userId = 1L;
        User mockUser = new User("testuser", "test@example.com");
        mockUser.setId(userId);
        
        when(userService.findById(userId)).thenReturn(mockUser);
        
        // When & Then
        mockMvc.perform(get("/api/users/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andDo(print()); // 打印请求和响应详情
        
        // 验证Service方法被调用
        verify(userService, times(1)).findById(userId);
    }
    
    @Test
    @DisplayName("测试获取用户API - 用户不存在")
    void testGetUser_NotFound() throws Exception {
        // Given
        Long userId = 999L;
        when(userService.findById(userId)).thenThrow(new UserNotFoundException("用户不存在"));
        
        // When & Then
        mockMvc.perform(get("/api/users/{id}", userId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
        
        verify(userService, times(1)).findById(userId);
    }
    
    @Test
    @DisplayName("测试创建用户API - 成功案例")
    void testCreateUser_Success() throws Exception {
        // Given
        CreateUserRequest request = new CreateUserRequest("newuser", "new@example.com");
        User createdUser = new User("newuser", "new@example.com");
        createdUser.setId(1L);
        
        when(userService.createUser(anyString(), anyString())).thenReturn(createdUser);
        
        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("new@example.com"));
        
        verify(userService, times(1)).createUser("newuser", "new@example.com");
    }
    
    @Test
    @DisplayName("测试创建用户API - 验证失败")
    void testCreateUser_ValidationError() throws Exception {
        // Given: 无效的请求数据
        CreateUserRequest request = new CreateUserRequest("", "invalid-email");
        
        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists())
                .andExpect(jsonPath("$.errors.username").exists())
                .andExpect(jsonPath("$.errors.email").exists());
        
        // 验证Service方法没有被调用
        verify(userService, never()).createUser(anyString(), anyString());
    }
}
```

##### 数据层测试
```java
/**
 * @DataJpaTest: 只加载JPA相关组件
 * 特点：使用内存数据库，事务自动回滚
 */
@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager; // 用于测试的EntityManager
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    @DisplayName("测试根据用户名查找用户")
    void testFindByUsername() {
        // Given
        User user = new User("testuser", "test@example.com");
        entityManager.persistAndFlush(user); // 立即保存到数据库
        
        // When
        Optional<User> found = userRepository.findByUsername("testuser");
        
        // Then
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getUsername());
        assertEquals("test@example.com", found.get().getEmail());
    }
    
    @Test
    @DisplayName("测试根据邮箱查找用户")
    void testFindByEmail() {
        // Given
        User user1 = new User("user1", "user1@example.com");
        User user2 = new User("user2", "user2@example.com");
        entityManager.persist(user1);
        entityManager.persist(user2);
        entityManager.flush();
        
        // When
        Optional<User> found = userRepository.findByEmail("user1@example.com");
        
        // Then
        assertTrue(found.isPresent());
        assertEquals("user1", found.get().getUsername());
    }
    
    @Test
    @DisplayName("测试用户名是否存在")
    void testExistsByUsername() {
        // Given
        User user = new User("existinguser", "existing@example.com");
        entityManager.persistAndFlush(user);
        
        // When & Then
        assertTrue(userRepository.existsByUsername("existinguser"));
        assertFalse(userRepository.existsByUsername("nonexistentuser"));
    }
    
    @Test
    @DisplayName("测试自定义查询方法")
    void testFindActiveUsers() {
        // Given
        User activeUser = new User("activeuser", "active@example.com");
        activeUser.setStatus(UserStatus.ACTIVE);
        
        User inactiveUser = new User("inactiveuser", "inactive@example.com");
        inactiveUser.setStatus(UserStatus.INACTIVE);
        
        entityManager.persist(activeUser);
        entityManager.persist(inactiveUser);
        entityManager.flush();
        
        // When
        List<User> activeUsers = userRepository.findByStatus(UserStatus.ACTIVE);
        
        // Then
        assertEquals(1, activeUsers.size());
        assertEquals("activeuser", activeUsers.get(0).getUsername());
    }
}
```

##### 服务层测试（使用Mock）
```java
/**
 * 纯单元测试：不加载Spring上下文，使用Mock对象
 */
@ExtendWith(MockitoExtension.class) // JUnit 5 + Mockito
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository; // Mock的Repository
    
    @Mock
    private EmailService emailService; // Mock的邮件服务
    
    @Mock
    private PasswordEncoder passwordEncoder; // Mock的密码编码器
    
    @InjectMocks
    private UserService userService; // 被测试的服务（自动注入Mock对象）
    
    @Test
    @DisplayName("测试创建用户 - 成功案例")
    void testCreateUser_Success() {
        // Given
        String username = "newuser";
        String email = "new@example.com";
        String rawPassword = "password123";
        String encodedPassword = "encoded_password";
        
        User savedUser = new User(username, email);
        savedUser.setId(1L);
        savedUser.setPassword(encodedPassword);
        
        // Mock行为设置
        when(userRepository.existsByUsername(username)).thenReturn(false);
        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        
        // When
        User result = userService.createUser(username, email, rawPassword);
        
        // Then
        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(username, result.getUsername());
        assertEquals(email, result.getEmail());
        assertEquals(encodedPassword, result.getPassword());
        
        // 验证Mock对象的调用
        verify(userRepository, times(1)).existsByUsername(username);
        verify(userRepository, times(1)).existsByEmail(email);
        verify(passwordEncoder, times(1)).encode(rawPassword);
        verify(userRepository, times(1)).save(any(User.class));
        verify(emailService, times(1)).sendWelcomeEmail(email, username);
    }
    
    @Test
    @DisplayName("测试创建用户 - 用户名已存在")
    void testCreateUser_UsernameExists() {
        // Given
        String username = "existinguser";
        String email = "new@example.com";
        
        when(userRepository.existsByUsername(username)).thenReturn(true);
        
        // When & Then
        DuplicateUsernameException exception = assertThrows(
            DuplicateUsernameException.class,
            () -> userService.createUser(username, email, "password")
        );
        
        assertEquals("用户名已存在: " + username, exception.getMessage());
        
        // 验证后续方法没有被调用
        verify(userRepository, times(1)).existsByUsername(username);
        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendWelcomeEmail(anyString(), anyString());
    }
    
    @Test
    @DisplayName("测试用户登录 - 成功案例")
    void testAuthenticate_Success() {
        // Given
        String username = "testuser";
        String rawPassword = "password123";
        String encodedPassword = "encoded_password";
        
        User user = new User(username, "test@example.com");
        user.setPassword(encodedPassword);
        user.setStatus(UserStatus.ACTIVE);
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(true);
        
        // When
        boolean result = userService.authenticate(username, rawPassword);
        
        // Then
        assertTrue(result);
        
        verify(userRepository, times(1)).findByUsername(username);
        verify(passwordEncoder, times(1)).matches(rawPassword, encodedPassword);
    }
    
    @Test
    @DisplayName("测试用户登录 - 密码错误")
    void testAuthenticate_WrongPassword() {
        // Given
        String username = "testuser";
        String rawPassword = "wrongpassword";
        String encodedPassword = "encoded_password";
        
        User user = new User(username, "test@example.com");
        user.setPassword(encodedPassword);
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(rawPassword, encodedPassword)).thenReturn(false);
        
        // When
        boolean result = userService.authenticate(username, rawPassword);
        
        // Then
        assertFalse(result);
        
        verify(userRepository, times(1)).findByUsername(username);
        verify(passwordEncoder, times(1)).matches(rawPassword, encodedPassword);
    }
}
```

## 7. 自定义注解

### 7.1 创建自定义注解

```java
// 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface LogExecutionTime {
    String value() default "";
    boolean enabled() default true;
}

// 使用注解
public class BusinessService {
    
    @LogExecutionTime("用户查询")
    public User findUser(Long id) {
        // 业务逻辑
        return userRepository.findById(id);
    }
    
    @LogExecutionTime(value = "数据处理", enabled = false)
    public void processData() {
        // 处理逻辑
    }
}
```

### 7.2 注解处理器实现

```java
@Component
@Aspect
public class LogExecutionTimeAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(LogExecutionTimeAspect.class);
    
    @Around("@annotation(logExecutionTime)")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint, 
                                  LogExecutionTime logExecutionTime) throws Throwable {
        
        if (!logExecutionTime.enabled()) {
            return joinPoint.proceed();
        }
        
        long startTime = System.currentTimeMillis();
        String operation = logExecutionTime.value().isEmpty() ? 
                          joinPoint.getSignature().getName() : 
                          logExecutionTime.value();
        
        try {
            Object result = joinPoint.proceed();
            long endTime = System.currentTimeMillis();
            logger.info("操作 [{}] 执行时间: {}ms", operation, endTime - startTime);
            return result;
        } catch (Exception e) {
            logger.error("操作 [{}] 执行失败", operation, e);
            throw e;
        }
    }
}
```

### 7.3 通过反射处理注解

```java
public class AnnotationProcessor {
    
    public static void processAnnotations(Object obj) {
        Class<?> clazz = obj.getClass();
        
        // 处理类级别注解
        if (clazz.isAnnotationPresent(Component.class)) {
            Component component = clazz.getAnnotation(Component.class);
            System.out.println("组件名称: " + component.value());
        }
        
        // 处理方法级别注解
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            if (method.isAnnotationPresent(LogExecutionTime.class)) {
                LogExecutionTime annotation = method.getAnnotation(LogExecutionTime.class);
                System.out.println("方法 " + method.getName() + 
                                 " 需要记录执行时间: " + annotation.value());
            }
        }
        
        // 处理字段级别注解
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            if (field.isAnnotationPresent(Autowired.class)) {
                System.out.println("字段 " + field.getName() + " 需要自动注入");
            }
        }
    }
}
```

## 8. 注解的最佳实践

### 8.1 设计原则

1. **单一职责**：每个注解只做一件事
2. **命名清晰**：注解名称应该清楚表达其用途
3. **参数合理**：提供合理的默认值，减少使用复杂度
4. **文档完善**：为注解和参数提供详细文档

### 8.2 使用建议

```java
// ❌ 不好的设计 - 职责不清
@AllInOne(log = true, validate = true, cache = true, retry = 3)
public void method() {}

// ✅ 好的设计 - 职责分离
@Log
@Validate
@Cacheable
@Retry(times = 3)
public void method() {}
```

### 8.3 性能考虑

```java
// 反射操作应该缓存
public class AnnotationCache {
    private static final Map<Class<?>, List<Method>> methodCache = new ConcurrentHashMap<>();
    
    public static List<Method> getAnnotatedMethods(Class<?> clazz, Class<? extends Annotation> annotation) {
        return methodCache.computeIfAbsent(clazz, k -> {
            return Arrays.stream(k.getDeclaredMethods())
                        .filter(m -> m.isAnnotationPresent(annotation))
                        .collect(Collectors.toList());
        });
    }
}
```

## 9. 常见错误和解决方案

### 9.1 注解丢失问题
```java
// 问题：运行时无法获取注解
@Target(ElementType.METHOD)
// @Retention(RetentionPolicy.RUNTIME)  // 忘记添加
public @interface MyAnnotation {}

// 解决：正确设置保留策略
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {}
```

### 9.2 继承问题
```java
// 问题：子类无法继承父类的注解
@Inherited  // 添加此注解使得注解可以被继承
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface Service {}
```

### 9.3 重复注解
```java
// Java 8+ 支持重复注解
@Repeatable(Schedules.class)
public @interface Schedule {
    String time();
}

public @interface Schedules {
    Schedule[] value();
}

// 使用
@Schedule(time = "morning")
@Schedule(time = "evening")
public void task() {}
```

## 10. 学习建议

### 10.1 循序渐进
1. **理解基础**：先掌握内置注解的使用
2. **框架应用**：学习Spring等框架中注解的使用
3. **自定义注解**：尝试创建自己的注解
4. **深入原理**：了解注解处理器和反射机制

### 10.2 实践项目
- 创建一个简单的Web项目，使用Spring Boot注解
- 实现一个日志记录的自定义注解
- 编写一个数据验证的注解系统

### 10.3 进阶学习
- 学习APT（Annotation Processing Tool）
- 了解编译时代码生成
- 研究主流框架的注解实现原理

## 总结

Java注解是一个强大的元编程工具，它让代码更加简洁、可读性更强。相比C++的宏系统，Java注解提供了更安全、更强大的元数据机制。掌握注解的使用不仅能让你更好地使用现有框架，还能帮你设计出更优雅的API。

注解是对代码的描述，而不是代码本身。正确理解和使用注解，将大大提升Java编程水平。

---

*感谢阅读！如果这篇文章对你有帮助，欢迎点赞和分享。*
