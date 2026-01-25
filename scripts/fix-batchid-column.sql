-- Script pour corriger le type de la colonne batchId
-- À exécuter dans Railway PostgreSQL

-- Changer le type de batchId de uuid à text
ALTER TABLE mascots 
ALTER COLUMN "batchId" TYPE text USING "batchId"::text;

-- Vérifier que la modification a fonctionné
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'mascots' 
  AND column_name = 'batchId';
