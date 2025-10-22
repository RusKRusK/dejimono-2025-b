#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/stat.h>
#include <fcntl.h>

#define PORT 8080
#define BUFFER_SIZE 2048
#define PUBLIC_DIR "public"

// ファイルの拡張子からContent-Type（MIMEタイプ）を決定する関数
const char* get_content_type(const char* path) {
    const char *dot = strrchr(path, '.');
    if (dot) {
        if (strcmp(dot, ".html") == 0) return "text/html; charset=utf-8";
        if (strcmp(dot, ".css") == 0) return "text/css";
        if (strcmp(dot, ".js") == 0) return "application/javascript";
    }
    return "application/octet-stream"; // 不明な場合はバイナリとして扱う
}

// 404 Not Found レスポンスをクライアントに送信する関数
void send_404(int client_socket) {
    const char* response = "HTTP/1.1 404 Not Found\r\n"
                           "Content-Type: text/plain; charset=utf-8\r\n"
                           "Content-Length: 9\r\n\r\n"
                           "Not Found";
    send(client_socket, response, strlen(response), 0);
}

// 200 OK レスポンスとともにファイルをクライアントに送信する関数
void send_file_response(int client_socket, const char* file_path) {
    // ファイルを読み込み専用で開く
    int file_fd = open(file_path, O_RDONLY);
    if (file_fd == -1) {
        perror("open");
        send_404(client_socket);
        return;
    }

    // ファイルの情報を取得（特にファイルサイズ）
    struct stat file_stat;
    if (fstat(file_fd, &file_stat) == -1) {
        perror("fstat");
        close(file_fd);
        send_404(client_socket);
        return;
    }

    // HTTPヘッダーを作成
    char header[BUFFER_SIZE];
    const char* content_type = get_content_type(file_path);
    sprintf(header, "HTTP/1.1 200 OK\r\n"
                    "Content-Type: %s\r\n"
                    "Content-Length: %ld\r\n\r\n", content_type, file_stat.st_size);

    // ヘッダーを送信
    send(client_socket, header, strlen(header), 0);

    // ファイルの内容をバッファに入れながら送信
    char file_buffer[BUFFER_SIZE];
    ssize_t bytes_read;
    while ((bytes_read = read(file_fd, file_buffer, BUFFER_SIZE)) > 0) {
        if (send(client_socket, file_buffer, bytes_read, 0) < 0) {
            perror("send file content");
            break;
        }
    }

    close(file_fd);
}

int main() {
    int server_socket, client_socket;
    struct sockaddr_in server_addr, client_addr;
    socklen_t client_addr_len = sizeof(client_addr);

    // 1. サーバーソケットの作成
    server_socket = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket < 0) {
        perror("socket");
        exit(EXIT_FAILURE);
    }

    int reuse = 1;
    if (setsockopt(server_socket, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse)) < 0) {
        perror("setsockopt");
        exit(EXIT_FAILURE);
    }

    // アドレス構造体の設定
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    // 2. ソケットにアドレスをバインド
    if (bind(server_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("bind");
        exit(EXIT_FAILURE);
    }

    // 3. 接続待機状態にする
    if (listen(server_socket, 10) < 0) {
        perror("listen");
        exit(EXIT_FAILURE);
    }

    printf("Server listening on port %d\n", PORT);
    printf("Access URL: http://localhost:%d\n", PORT);

    // 無限ループでクライアントからの接続を待つ
    while (1) {
        // 4. クライアントからの接続を受け入れる
        client_socket = accept(server_socket, (struct sockaddr*)&client_addr, &client_addr_len);
        if (client_socket < 0) {
            perror("accept");
            continue; // エラーが発生してもサーバーは続行
        }

        char client_ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &client_addr.sin_addr, client_ip, INET_ADDRSTRLEN);
        printf("\nAccepted connection from %s\n", client_ip);

        // リクエストをバッファに読み込む
        char buffer[BUFFER_SIZE] = {0};
        ssize_t bytes_received = recv(client_socket, buffer, BUFFER_SIZE - 1, 0);
        if (bytes_received < 0) {
            perror("recv");
            close(client_socket);
            continue;
        }
        if (bytes_received == 0) {
            printf("Client disconnected.\n");
            close(client_socket);
            continue;
        }

        // 5. HTTPリクエストを解析
        char *method = strtok(buffer, " \t\r\n");
        char *path   = strtok(NULL, " \t\r\n");

        if (method == NULL || path == NULL) {
            fprintf(stderr, "Could not parse HTTP request.\n");
            close(client_socket);
            continue;
        }

        // --- デバッグログ ---
        printf("DEBUG: Parsed Method: '%s'\n", method);
        printf("DEBUG: Parsed Path:   '%s'\n", path);

        
        // パスからクエリパラメータ（'?'以降）を除去する
        char *query_string = strchr(path, '?');
        if (query_string) {
            *query_string = '\0';
        }
        
        // 6. ファイルパスを構築
        char file_path[512];
        if (strcmp(path, "/") == 0) {
            snprintf(file_path, sizeof(file_path), "%s/pages/index.html", PUBLIC_DIR);
        } else if (strcmp(path, "/borrowing") == 0) {
            snprintf(file_path, sizeof(file_path), "%s/pages/borrowing.html", PUBLIC_DIR);
        } else if (strcmp(path, "/return") == 0) {
            snprintf(file_path, sizeof(file_path), "%s/pages/return.html", PUBLIC_DIR);
        }
        else {
            snprintf(file_path, sizeof(file_path), "%s/%s", PUBLIC_DIR, path + 1);
        }

        printf("Requested file: %s\n", file_path);

        // 7. レスポンスを送信
        send_file_response(client_socket, file_path);

        // 8. クライアントソケットを閉じる
        close(client_socket);
    }

    // サーバーソケットを閉じる
    close(server_socket);
    return 0;
}

