# Solution : Erreur "Syntax error on line 12: Unexpected token ..."

## 🎯 Problème identifié

L'erreur venait du spread operator `...options` dans la méthode `request()` de l'API client. Le code utilisait :

```javascript
const response = await fetch(url, {
  ...options,  // ❌ Problème ici
  headers: { ... }
});
```

## ✅ Solution appliquée

J'ai remplacé le spread operator par une construction explicite :

```javascript
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${this.token}`
};

// Merge custom headers if provided
if (options.headers) {
  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else {
    Object.assign(headers, options.headers);
  }
}

const requestOptions = {
  method: options.method,
  body: options.body,
  headers,
};
```

## 📋 Rebuild effectué

Le code a été rebundlé sans le spread operator problématique.

## ✅ Prochaines étapes

1. **Rechargez le plugin dans Figma** :
   - Supprimez le plugin de la liste
   - Rechargez avec `manifest.json`
   - Lancez le plugin

2. **Vérifiez la console** :
   - Vous devriez voir `[MascotForge] Initializing plugin...`
   - Plus d'erreur "Syntax error on line 12"

3. **Le panneau devrait s'ouvrir** avec l'interface !
