#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <unistd.h>

int main(int argc, char **argv) {
    int command = 1;
    if (argc < 2) {
        fputs("usage: local-only [--check-file PATH] COMMAND [ARGS...]\n", stderr);
        return 2;
    }

    if (setiopolicy_np(IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES,
                      IOPOL_SCOPE_PROCESS, IOPOL_MATERIALIZE_DATALESS_FILES_OFF) == -1) {
        perror("local-only: setiopolicy_np");
        return 1;
    }

    while (strcmp(argv[command], "--check-file") == 0) {
        if (command + 2 >= argc) {
            fputs("local-only: --check-file requires a path and a command\n", stderr);
            return 2;
        }
        const char *file = argv[command + 1];
        struct stat info;
        int result = stat(file, &info);
        if ((result == 0 && (info.st_flags & SF_DATALESS)) ||
            (result == -1 && errno == EDEADLK)) {
            fprintf(stderr, "%s: cloud-only. Use Finder → Download Now to read it.\n", file);
            return 1;
        }
        command += 2;
    }

    execvp(argv[command], argv + command);
    int error = errno;
    perror(argv[command]);
    return error == ENOENT ? 127 : 126;
}
