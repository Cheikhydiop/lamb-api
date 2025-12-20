FROM node:18-alpine

WORKDIR /app

# Copier les fichiers nécessaires pour npm install
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Donner les permissions à l'utilisateur node sur tout le dossier de travail
RUN chown -R node:node /app

# Utiliser l'utilisateur node
USER node

# Exposer le port de l'application
EXPOSE 4000

# Commande par défaut
CMD ["npm", "run", "dev"]
