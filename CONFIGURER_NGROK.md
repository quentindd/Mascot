# 🔐 Configuration ngrok - Authtoken requis

## Étape 1 : Créer un compte ngrok (gratuit)

1. Allez sur : https://dashboard.ngrok.com/signup
2. Inscrivez-vous avec votre email ou GitHub
3. Vérifiez votre email

## Étape 2 : Obtenir votre authtoken

1. Allez sur : https://dashboard.ngrok.com/get-started/your-authtoken
2. Copiez votre authtoken (ressemble à : `2abc...xyz`)

## Étape 3 : Configurer ngrok

Dans le terminal, exécutez :

```bash
~/bin/ngrok config add-authtoken VOTRE_AUTHTOKEN
```

Remplacez `VOTRE_AUTHTOKEN` par le token copié.

## Étape 4 : Relancer ngrok

```bash
~/bin/ngrok http 3000
```

---

## Alternative rapide (si vous avez déjà un compte)

Si vous avez déjà un compte ngrok :

1. Connectez-vous : https://dashboard.ngrok.com/login
2. Allez sur : https://dashboard.ngrok.com/get-started/your-authtoken
3. Copiez votre authtoken
4. Exécutez : `~/bin/ngrok config add-authtoken VOTRE_AUTHTOKEN`
5. Relancez : `~/bin/ngrok http 3000`

---

## Plan gratuit ngrok

Le plan gratuit offre :
- ✅ Tunnels illimités
- ✅ 1 agent en ligne simultané
- ⚠️ URL change à chaque redémarrage
- ✅ Parfait pour le développement

Pour une URL fixe, il faut un plan payant ($8/mois).
