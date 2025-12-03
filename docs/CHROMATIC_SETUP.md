# 🎨 Configuração do Chromatic (Opcional)

O Chromatic é uma ferramenta de visual testing que compara componentes com designs do Figma. É **opcional** - o projeto funciona sem ele.

## ⚠️ Status Atual

O workflow do Chromatic está configurado mas **não falhará** se o token não estiver configurado. Ele apenas será pulado.

## 🔧 Como Configurar (Opcional)

Se você quiser habilitar visual testing com Chromatic:

### 1. Criar Conta no Chromatic

1. Acesse: https://www.chromatic.com/start
2. Faça login com GitHub
3. Crie um novo projeto ou conecte um existente

### 2. Obter Token do Projeto

1. No Chromatic, vá em **Manage** → **Project Settings**
2. Copie o **Project Token**

### 3. Adicionar Secret no GitHub

1. Vá no seu repositório GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Nome: `CHROMATIC_PROJECT_TOKEN`
5. Valor: Cole o token copiado do Chromatic
6. Clique em **Add secret**

### 4. Testar

1. Faça um push para o repositório
2. O workflow do Chromatic executará automaticamente
3. Verifique os resultados no Chromatic

## ✅ Sem Configuração

Se você **não configurar** o token:
- ✅ O projeto continua funcionando normalmente
- ✅ O workflow do Chromatic será pulado (não falhará)
- ✅ Você verá uma mensagem: "Chromatic token not configured. Skipping visual testing."

## 📚 Documentação

- [Chromatic Documentation](https://www.chromatic.com/docs)
- [GitHub Actions Integration](https://www.chromatic.com/docs/github-actions)

