/*
  Warnings:

  - Added the required column `horario` to the `registros_ponto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoHorario` to the `registros_ponto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoHorario" AS ENUM ('ENTRADA', 'SAIDA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO');

-- AlterTable - Adicionar colunas com valores padrão temporários
ALTER TABLE "registros_ponto" ADD COLUMN "horario" TEXT,
ADD COLUMN "tipoHorario" "TipoHorario";

-- Migrar dados existentes - priorizar entrada > saida > saidaAlmoco > retornoAlmoco
UPDATE "registros_ponto" 
SET "horario" = COALESCE("entrada", "saida", "saidaAlmoco", "retornoAlmoco", '00:00'),
    "tipoHorario" = CASE 
        WHEN "entrada" IS NOT NULL THEN 'ENTRADA'::"TipoHorario"
        WHEN "saida" IS NOT NULL THEN 'SAIDA'::"TipoHorario"
        WHEN "saidaAlmoco" IS NOT NULL THEN 'SAIDA_ALMOCO'::"TipoHorario"
        WHEN "retornoAlmoco" IS NOT NULL THEN 'RETORNO_ALMOCO'::"TipoHorario"
        ELSE 'ENTRADA'::"TipoHorario"
    END
WHERE "horario" IS NULL OR "tipoHorario" IS NULL;

-- Tornar as colunas obrigatórias
ALTER TABLE "registros_ponto" ALTER COLUMN "horario" SET NOT NULL;
ALTER TABLE "registros_ponto" ALTER COLUMN "tipoHorario" SET NOT NULL;
