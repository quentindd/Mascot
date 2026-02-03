# Tarification (credits)

Référence : **1 credit ≈ 0,01 $** (génération à coût très faible, focus petits prix).

## Coût par action

| Action              | Crédits | Coût approx. |
|---------------------|---------|----------------|
| Mascot (3 variations) | 1 cr   | ~0,01 $       |
| Custom (pose)       | 5 cr    | ~0,05 $       |

## Packs de crédits (Stripe)

| Pack     | Crédits | Prix USD | $/cr   |
|----------|---------|----------|--------|
| Starter  | 20      | 1,99 $   | 0,10 $ |
| Popular  | 50      | 4,99 $   | 0,10 $ |
| Pro      | 100     | 8,99 $   | 0,09 $ (−10 %) |

Plans Stripe : `"20"` | `"50"` | `"100"`.

## Marges (estimation)

Révenue par crédit quand l’utilisateur achète un pack (prix du pack ÷ nombre de crédits) :

| Pack   | Revenu par crédit |
|--------|--------------------|
| Starter (20 cr)  | 1,99 / 20 ≈ **0,10 $/cr** |
| Popular (50 cr) | 4,99 / 50 ≈ **0,10 $/cr** |
| Pro (100 cr)    | 8,99 / 100 ≈ **0,09 $/cr** |

Pour une **marge par action**, il faut soustraire ton coût API (Replicate, etc.) au revenu que représente la consommation de crédits.

**Exemple** (à adapter avec tes vrais coûts) :

| Action   | Crédits | Revenu (à 0,10 $/cr) | Coût API (ex.) | Marge $   | Marge %   |
|----------|---------|----------------------|----------------|-----------|-----------|
| Mascot   | 1 cr    | 0,10 $               | ~0,003 $       | 0,097 $   | **~97 %** |
| Pose     | 5 cr    | 0,50 $               | ~0,05 $        | 0,45 $    | **~90 %** |

- Si **pose te coûte 0,05 $** et tu factures 5 cr ≈ 0,50 $ (pack à 0,10 $/cr), marge pose ≈ **90 %**.
- Si ton coût pose est plus bas (ex. 0,01 $), marge pose ≈ **98 %**.
- Mascot « coûte presque rien » → marge mascot très élevée tant que 1 cr > coût API.

**Formule** : Marge % = (Revenu − Coût API) / Revenu.  
Remplace « Coût API » par tes coûts réels (Replicate, etc.) pour obtenir tes marges.
