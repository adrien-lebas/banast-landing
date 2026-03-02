# Guide Analytics Banast

## Configuration

Le système de tracking utilise **Plausible Analytics** (privacy-first, sans cookies) avec des événements personnalisés pour mesurer l'engagement.

### Accès au Dashboard
- URL: https://plausible.io/banast.com
- Connexion avec tes identifiants Plausible

## Événements Trackés

### Page Principale (`index.html`)

#### 1. **Scroll Depth**
- `Scroll Depth: 25%/50%/75%/100%` - Milestones de scroll
- `Page Completed` - Quand l'utilisateur atteint le bas (avec durée)
- `First Scroll` - Temps avant le premier scroll

#### 2. **Sections Vues**
- `Section Viewed: Hero Section`
- `Section Viewed: Golden Circle`
- `Section Viewed: Flow Diagram`
- `Section Viewed: Personas`
- `Section Viewed: CTA Section`

#### 3. **Golden Circle Engagement**
- `Golden Circle Phase: Core/Actions/Modules` - Progression dans l'animation
- `Golden Circle Engagement` - Temps passé dans la section

#### 4. **Interactions CTA**
- `CTA Click: navigation` - Clic sur "Test your landing page"
- `CTA Click: hero` - Clic dans le hero
- `CTA Click: alternative` - Lien alternatif
- `Email Form: started` - Début de saisie
- `Email Form: submitted` - Soumission
- `Goal: Email Signup` - Conversion

#### 5. **Engagement Général**
- `Page Engaged` - Utilisateur engagé (>3 secondes)
- `Flow Animation: viewed` - Animation du flow diagram vue
- `Session Paused` - Tab en arrière-plan
- `Bounce` - Départ sans interaction

### Page Free Audit (`/free-audit`)

#### 1. **Funnel d'Audit**
- `Audit Form Started` - Début de saisie URL
- `Audit Form Submitted` - Soumission
- `Goal: Free Audit Started` - Conversion démarrage

#### 2. **Progression de l'Analyse**
- `Analysis Started` - Début de l'analyse
- `Agent Completed: Problem Agent/Offer Agent/Growth Agent/Final Verdict`
- `Analysis Completed` - Tous les agents terminés
- `Goal: Audit Completed` - Analyse complète

#### 3. **Conversion Finale**
- `Booking CTA Viewed` - CTA calendrier visible
- `Booking CTA Clicked` - Clic sur le lien
- `Goal: Booking Link Clicked` - Conversion ultime

#### 4. **Abandons**
- `Analysis Abandoned` - Départ pendant l'analyse
- `Audit Page Bounce` - Départ sans interaction

## Métriques Importantes à Surveiller

### Taux de Conversion
1. **Visiteurs → Email Signup** (page principale)
2. **Visiteurs → Audit Started** (free-audit)
3. **Audit Started → Booking Clicked** (funnel complet)

### Engagement
- **Scroll Depth moyen** - Profondeur de lecture
- **Sections vues** - Quelles sections attirent
- **Golden Circle phases** - Engagement avec l'animation
- **Temps sur page** - Durée des sessions

### Points de Friction
- **Bounce rate** - Départs immédiats
- **Analysis Abandoned** - Abandons pendant l'audit
- **Tab Hidden** - Perte d'attention

## Goals dans Plausible

Configure ces goals dans Plausible pour un suivi facile :

1. `Goal: Email Signup` - Conversion newsletter
2. `Goal: Free Audit Started` - Démarrage audit
3. `Goal: Audit Completed` - Fin de l'analyse
4. `Goal: Booking Link Clicked` - Conversion finale

## Analyse des Données

### Questions à se poser

1. **Acquisition**
   - D'où viennent les visiteurs qui convertissent le mieux ?
   - Quelle source génère le plus d'audits ?

2. **Engagement**
   - À quel moment perdons-nous les visiteurs ? (scroll depth)
   - Quelles sections sont les plus vues ?
   - Combien de temps passent-ils sur le Golden Circle ?

3. **Conversion**
   - Quel est le taux de conversion global ?
   - Où se situent les abandons dans le funnel ?
   - Combien d'audits mènent à un booking ?

4. **Performance**
   - Les temps de chargement impactent-ils le bounce rate ?
   - Y a-t-il une corrélation entre scroll depth et conversion ?

## Optimisations Suggérées

### Court Terme
- Surveiller le bounce rate de la page free-audit
- Analyser le temps entre audit et booking
- Identifier les sections peu vues

### Moyen Terme
- A/B test sur les CTA texts
- Optimiser les sections avec peu d'engagement
- Réduire le temps de l'analyse fake (si abandons élevés)

### Long Terme
- Créer des segments d'utilisateurs
- Personnaliser le parcours selon la source
- Automatiser le suivi post-audit

## Debug

Pour voir les événements en temps réel dans la console :
1. Ouvre la console du navigateur (F12)
2. Les événements apparaissent avec le prefix `📊 Tracked:`
3. Vérifie dans Plausible après ~5 minutes

## Support

Pour toute question sur les analytics :
- Dashboard Plausible : https://plausible.io/banast.com
- Documentation Plausible : https://plausible.io/docs
- Modifier le tracking : éditer `analytics.js` ou `analytics-audit.js`