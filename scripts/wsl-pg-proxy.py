#!/usr/bin/env python3
"""Forward 0.0.0.0:5433 -> 127.0.0.1:5432 so Windows can reach WSL Postgres (listen_addresses=localhost)."""
import socket
import threading

LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 5433
TARGET = ("127.0.0.1", 5432)


def pipe(src: socket.socket, dst: socket.socket) -> None:
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except OSError:
        pass
    finally:
        try:
            src.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            dst.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        src.close()
        dst.close()


def handle_client(client: socket.socket) -> None:
    upstream = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        upstream.connect(TARGET)
    except OSError:
        client.close()
        return
    t1 = threading.Thread(target=pipe, args=(client, upstream), daemon=True)
    t2 = threading.Thread(target=pipe, args=(upstream, client), daemon=True)
    t1.start()
    t2.start()
    t1.join()
    t2.join()


def main() -> None:
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((LISTEN_HOST, LISTEN_PORT))
    server.listen(128)
    print(f"wsl-pg-proxy listening on {LISTEN_HOST}:{LISTEN_PORT} -> {TARGET[0]}:{TARGET[1]}", flush=True)
    while True:
        conn, _ = server.accept()
        threading.Thread(target=handle_client, args=(conn,), daemon=True).start()


if __name__ == "__main__":
    main()
