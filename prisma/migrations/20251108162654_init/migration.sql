-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('NORMAL', 'FERIADO', 'FALTA', 'ATESTADO', 'FERIAS');

-- CreateEnum
CREATE TYPE "StatusRegistro" AS ENUM ('PENDENTE', 'COMPLETO', 'INCOMPLETO');

-- CreateEnum
CREATE TYPE "StatusFechamento" AS ENUM ('ABERTO', 'EM_ANALISE', 'APROVADO', 'FECHADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "avatar" TEXT,
    "faceDescriptor" TEXT,
    "cargo" TEXT,
    "departamento" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_ponto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "entrada" TEXT,
    "saidaAlmoco" TEXT,
    "retornoAlmoco" TEXT,
    "saida" TEXT,
    "observacao" TEXT,
    "tipo" "TipoRegistro" NOT NULL DEFAULT 'NORMAL',
    "status" "StatusRegistro" NOT NULL DEFAULT 'PENDENTE',
    "periodoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_ponto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_fechamento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "totalHorasTrabalhadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHorasExtras" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHorasDevidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cargaHorariaMensal" DOUBLE PRECISION NOT NULL DEFAULT 176,
    "status" "StatusFechamento" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_pin_key" ON "users"("pin");

-- CreateIndex
CREATE INDEX "registros_ponto_userId_idx" ON "registros_ponto"("userId");

-- CreateIndex
CREATE INDEX "registros_ponto_data_idx" ON "registros_ponto"("data");

-- CreateIndex
CREATE INDEX "registros_ponto_periodoId_idx" ON "registros_ponto"("periodoId");

-- CreateIndex
CREATE INDEX "periodos_fechamento_userId_idx" ON "periodos_fechamento"("userId");

-- CreateIndex
CREATE INDEX "periodos_fechamento_dataInicio_idx" ON "periodos_fechamento"("dataInicio");

-- CreateIndex
CREATE INDEX "periodos_fechamento_dataFim_idx" ON "periodos_fechamento"("dataFim");

-- AddForeignKey
ALTER TABLE "registros_ponto" ADD CONSTRAINT "registros_ponto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_ponto" ADD CONSTRAINT "registros_ponto_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_fechamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodos_fechamento" ADD CONSTRAINT "periodos_fechamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
