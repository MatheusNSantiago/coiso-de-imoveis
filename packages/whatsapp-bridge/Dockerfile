# Etapa de build: usa uma imagem Go para compilar a aplicação
FROM golang:1.22-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala as dependências necessárias para o go-sqlite3, que usa CGO
RUN apk add --no-cache gcc musl-dev

# Copia os arquivos de gerenciamento de dependências
COPY go.mod go.sum ./
# Baixa as dependências
RUN go mod download

# Copia o resto do código fonte da aplicação
COPY . .

# Compila a aplicação. CGO_ENABLED=1 é necessário para sqlite.
# O output será um arquivo executável chamado 'whatsapp-bridge'
RUN CGO_ENABLED=1 go build -o /whatsapp-bridge

# Etapa final: usa uma imagem Alpine limpa, que é muito pequena
FROM alpine:latest

# Define o diretório de trabalho
WORKDIR /root/

# Copia apenas o executável compilado da etapa de build
COPY --from=builder /whatsapp-bridge .

# Expõe a porta 8080, que é a porta que o servidor de API em Go usa
EXPOSE 8080

# Define um volume. No Railway, vamos "montar" um disco persistente aqui.
# Isso garante que a sessão do WhatsApp (o login via QR code) não se perca
# quando o container reiniciar.
VOLUME /root/store

# O comando que será executado quando o container iniciar
CMD ["./whatsapp-bridge"]
