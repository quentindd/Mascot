# Pourquoi l'authentification est nécessaire

## 🎯 Le problème

L'utilisateur est déjà connecté à Figma, alors pourquoi demander une authentification supplémentaire ?

## ✅ La réponse

### 1. **Figma ne fournit pas d'identité utilisateur aux plugins**
- Les plugins Figma n'ont pas accès à l'email ou à l'identité de l'utilisateur Figma
- Figma ne fournit pas d'API d'authentification pour les plugins
- Chaque plugin doit gérer sa propre authentification

### 2. **L'API backend a besoin d'authentification**
- Pour générer des mascots, animations, logos → besoin d'appeler l'API backend
- L'API backend doit savoir qui fait la requête (pour les crédits, la facturation, etc.)
- L'API backend doit être sécurisée (pas accessible sans authentification)

### 3. **Solutions possibles**

#### Option A : Mode Demo (implémenté)
- Permet d'explorer l'interface sans authentification
- Les fonctionnalités de génération ne fonctionnent pas
- Utile pour tester l'UI

#### Option B : OAuth avec redirection web (recommandé pour production)
- L'utilisateur clique sur "Sign In"
- Le plugin ouvre une fenêtre web vers `https://mascotforge.com/auth/figma`
- L'utilisateur se connecte sur le site web
- Le site web redirige vers le plugin avec un token
- Le token est stocké dans `figma.clientStorage`

#### Option C : Utiliser l'identité Figma (si disponible)
- Si Figma ajoute une API d'identité dans le futur
- On pourrait utiliser `figma.currentUser` (mais ça ne donne que le nom, pas l'email)

## 🚀 Solution actuelle

Pour l'instant, j'ai ajouté :
1. **Mode Demo** : Permet d'explorer l'interface sans authentification
2. **Sign In avec token** : Pour les utilisateurs qui ont déjà un compte

## 📋 Pour la production

Il faudra implémenter OAuth :
1. L'utilisateur clique sur "Sign In"
2. Le plugin ouvre `https://mascotforge.com/auth/figma?redirect=figma://...`
3. L'utilisateur se connecte sur le site
4. Le site redirige vers le plugin avec un token
5. Le plugin stocke le token

## 🔧 Amélioration future

On pourrait aussi :
- Détecter si l'utilisateur a déjà un compte (via cookie/localStorage du site web)
- Proposer une connexion automatique si possible
- Utiliser un système de "guest mode" avec limitations
