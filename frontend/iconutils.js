// src/utils/iconUtils.js (updated function)

import { iconMap } from './devicon-lookup.js';

export function getIconName(techName) {
    if (!techName) return null;
    
    const lowerName = techName.toLowerCase().trim();
    
    // --- Step 1: Direct key match (fastest) ---
    if (iconMap[lowerName]) {
        return lowerName; // e.g., "python" -> "python"
    }
    
    // --- Step 2: Hardcoded common variations (Expanded List) ---

    // JavaScript Frameworks & Libraries
    if (lowerName === 'vue.js' || lowerName === 'vue js' || lowerName === 'vue') return 'vuejs';
    if (lowerName === 'react.js' || lowerName === 'react js' || lowerName === 'react') return 'react';
    if (lowerName === 'react native') return 'react'; // 'react' icon is used for native
    if (lowerName === 'angular.js' || lowerName === 'angular js' || lowerName === 'angular') return 'angularjs';
    if (lowerName === 'node.js' || lowerName === 'node js' || lowerName === 'node') return 'nodejs';
    if (lowerName === 'express.js' || lowerName === 'express js' || lowerName === 'express') return 'express';
    if (lowerName === 'next.js' || lowerName === 'next js') return 'nextjs';
    if (lowerName === 'nuxt.js' || lowerName === 'nuxt js') return 'nuxtjs';
    if (lowerName === 'jquery') return 'jquery';
    if (lowerName === 'd3' || lowerName === 'd3.js') return 'd3js';

    // Core Web
    if (lowerName === 'js') return 'javascript';
    if (lowerName === 'ts') return 'typescript';
    if (lowerName === 'html' || lowerName === 'html 5') return 'html5';
    if (lowerName === 'css' || lowerName === 'css 3') return 'css3';

    // CSS Frameworks
    if (lowerName === 'tailwind css' || lowerName === 'tailwind') return 'tailwindcss';
    if (lowerName === 'sass') return 'sass';
    if (lowerName === 'less') return 'less';
    if (lowerName === 'bootstrap') return 'bootstrap';

    // C-Family & .NET
    if (lowerName === 'c#') return 'csharp';
    if (lowerName === 'c++') return 'cplusplus';
    if (lowerName === '.net' || lowerName === 'dotnet') return 'dot-net';
    if (lowerName === 'sql server' || lowerName === 'microsoft sql server') return 'microsoftsqlserver';
    
    // Java & JVM
    if (lowerName === 'java') return 'java';
    if (lowerName === 'spring' || lowerName === 'spring boot') return 'spring';
    if (lowerName === 'kotlin') return 'kotlin';
    
    // Python & Data Science
    if (lowerName === 'jupyter notebook' || lowerName === 'jupyter' || lowerName === 'jupyterlab' || lowerName === 'jupyter lab') return 'jupyter';
    if (lowerName === 'fastapi') return 'fastapi';
    if (lowerName === 'django') return 'django';
    if (lowerName === 'flask') return 'flask';
    
    // Database
    if (lowerName === 'postgresql' || lowerName === 'postgres') return 'postgresql';
    if (lowerName === 'mongo' || lowerName === 'mongodb') return 'mongodb';
    if (lowerName === 'mysql') return 'mysql';
    if (lowerName === 'sqlite') return 'sqlite';
    if (lowerName === 'redis') return 'redis';
    
    // Cloud & DevOps
    if (lowerName === 'aws' || lowerName === 'amazon web services') return 'amazonwebservices';
    if (lowerName === 'gcp' || lowerName === 'google cloud') return 'googlecloud';
    if (lowerName === 'kubernetes' || lowerName === 'k8s') return 'kubernetes';
    if (lowerName === 'digital ocean') return 'digitalocean';
    if (lowerName === 'tf' || lowerName === 'tensorflow') return 'tensorflow';
    if (lowerName === 'docker') return 'docker';
    if (lowerName === 'git') return 'git';
    if (lowerName === 'linux') return 'linux';
    
    // Mobile
    if (lowerName === 'android') return 'android';
    if (lowerName === 'flutter') return 'flutter';
    if (lowerName === 'swift') return 'swift';

    // Other Tools
    if (lowerName === 'go' || lowerName === 'golang') return 'go';
    if (lowerName === 'visual studio code' || lowerName === 'vscode') return 'vscode';
    if (lowerName === 'visual studio') return 'visualstudio';
    if (lowerName === 'ruby on rails' || lowerName === 'rails') return 'rails';
    if (lowerName === 'php') return 'php';
    if (lowerName === 'figma') return 'figma';
    if (lowerName === 'after effects') return 'aftereffects';

    // Data Science & AI
    if (lowerName === 'pytorch') return 'pytorch';
    if (lowerName === 'scikit-learn' || lowerName === 'sklearn') return 'scikit-learn';
    if (lowerName === 'pandas') return 'pandas';
    if (lowerName === 'numpy') return 'numpy';
    if (lowerName === 'r' || lowerName === 'rlang') return 'r';
    if (lowerName === 'matlab') return 'matlab';

    // Cloud & DevOps (More)
    if (lowerName === 'azure') return 'azure';
    if (lowerName === 'firebase') return 'firebase';
    if (lowerName === 'oracle' || lowerName === 'oci') return 'oracle';
    if (lowerName === 'terraform') return 'terraform';
    if (lowerName === 'ansible') return 'ansible';
    if (lowerName === 'jenkins') return 'jenkins';
    if (lowerName === 'github' || lowerName === 'github actions') return 'github';
    if (lowerName === 'gitlab') return 'gitlab';
    if (lowerName === 'bitbucket') return 'bitbucket';
    if (lowerName === 'nginx') return 'nginx';
    if (lowerName === 'apache') return 'apache';
    if (lowerName === 'kafka' || lowerName === 'apache kafka') return 'kafka';
    
    // Shell & Scripting
    if (lowerName === 'bash' || lowerName === 'shell' || lowerName === 'shell script') return 'bash';
    if (lowerName === 'powershell') return 'powershell';

    // Other Languages & Frameworks
    if (lowerName === 'c') return 'c';
    if (lowerName === 'dart') return 'dart';
    if (lowerName === 'svelte') return 'svelte';
    if (lowerName === 'graphql') return 'graphql';
    if (lowerName === 'wordpress') return 'wordpress';
    if (lowerName === 'laravel') return 'laravel';
    
    // Game Dev
    if (lowerName === 'unity') return 'unity';
    if (lowerName === 'unreal engine') return 'unrealengine';

    // Design & Productivity
    if (lowerName === 'blender') return 'blender';
    if (lowerName === 'photoshop') return 'photoshop';
    if (lowerName === 'illustrator') return 'illustrator';
    if (lowerName === 'adobe xd' || lowerName === 'xd') return 'xd';
    if (lowerName === 'jira') return 'jira';
    if (lowerName === 'trello') return 'trello';
    if (lowerName === 'notion') return 'notion';

    // JS Tooling
    if (lowerName === 'jest') return 'jest';
    if (lowerName === 'cypress') return 'cypress';
    if (lowerName === 'webpack') return 'webpack';
    if (lowerName === 'vite' || lowerName === 'vitejs') return 'vitejs';
    if (lowerName === 'babel') return 'babel';
    if (lowerName === 'eslint') return 'eslint';
    if (lowerName === 'prettier') return 'prettier';
    
    // Hardware
    if (lowerName === 'raspberry pi') return 'raspberrypi';

    // More Languages
    if (lowerName === 'rust') return 'rust';
    if (lowerName === 'scala') return 'scala';
    if (lowerName === 'lua') return 'lua';
    if (lowerName === 'perl') return 'perl';
    if (lowerName === 'elixir') return 'elixir';
    if (lowerName === 'haskell') return 'haskell';
    if (lowerName === 'clojure') return 'clojure';
    if (lowerName === 'erlang') return 'erlang';
    if (lowerName === 'f#' || lowerName === 'fsharp') return 'fsharp';
    if (lowerName === 'objective-c' || lowerName === 'objectivec') return 'objectivec';

    // More DevOps & Networking
    if (lowerName === 'prometheus') return 'prometheus';
    if (lowerName === 'grafana') return 'grafana';
    if (lowerName === 'vagrant') return 'vagrant';
    if (lowerName === 'HAProxy') return 'haproxy';
    if (lowerName === 'travis' || lowerName === 'travis ci') return 'travis';
    if (lowerName === 'circleci') return 'circleci';
    if (lowerName === 'sonarqube') return 'sonarqube';

    // More Data & DB
    if (lowerName === 'elasticsearch') return 'elasticsearch';
    if (lowerName === 'kibana') return 'kibana';
    if (lowerName === 'logstash') return 'logstash';
    if (lowerName === 'cassandra') return 'cassandra';
    if (lowerName === 'couchdb') return 'couchdb';
    if (lowerName === 'neo4j') return 'neo4j';
    if (lowerName === 'rabbitmq') return 'rabbitmq';
    
    // More Frameworks & JS
    if (lowerName === 'sveltekit') return 'svelte'; // Svelte icon is used
    if (lowerName === 'gatsby') return 'gatsby';
    if (lowerName === 'ember') return 'ember';
    if (lowerName === 'backbone' || lowerName === 'backbonejs') return 'backbonejs';
    if (lowerName === 'redux') return 'redux';
    if (lowerName === 'gulp') return 'gulp';
    if (lowerName === 'grunt') return 'grunt';
    
    // Other Tools
    if (lowerName === 'qt') return 'qt';
    if (lowerName === 'unreal') return 'unrealengine';
    if (lowerName === 'sketch') return 'sketch';
    if (lowerName === 'invision') return 'invision';
    if (lowerName === 'slack') return 'slack';
    if (lowerName === 'discord') return 'discord';
    if (lowerName === 'atom') return 'atom';
    if (lowerName === 'vim') return 'vim';
    if (lowerName === 'neovim' || lowerName === 'nvim') return 'neovim';
    if (lowerName === 'sublime text') return 'sublimetext';
    if (lowerName === 'android studio') return 'androidstudio';
    if (lowerName === 'xcode') return 'xcode';
    if (lowerName === 'intellij') return 'intellij';
    if (lowerName === 'pycharm') return 'pycharm';
    if (lowerName === 'webstorm') return 'webstorm';

    // Cloud Services (Specific)
    if (lowerName === 'aws s3' || lowerName === 's3') return 'amazonwebservices'; // AWS icon
    if (lowerName === 'aws lambda' || lowerName === 'lambda') return 'amazonwebservices'; // AWS icon
    if (lowerName === 'aws ec2' || lowerName === 'ec2') return 'amazonwebservices'; // AWS icon
    if (lowerName === 'aws rds' || lowerName === 'rds') return 'amazonwebservices'; // AWS icon
    if (lowerName === 'azure functions') return 'azure'; // Azure icon
    if (lowerName === 'google cloud functions' || lowerName === 'gcloud functions') return 'googlecloud'; // GCP icon
    if (lowerName === 'heroku') return 'heroku';

    // Content Management Systems (CMS)
    if (lowerName === 'joomla') return 'joomla';
    if (lowerName === 'drupal') return 'drupal';
    if (lowerName === 'shopify') return 'shopify';
    if (lowerName === 'magento') return 'magento';

    // More JS & CSS
    if (lowerName === 'npm') return 'npm';
    if (lowerName === 'yarn') return 'yarn';
    if (lowerName === 'pnpm') return 'pnpm';
    if (lowerName === 'styled components') return 'styledcomponents';
    if (lowerName === 'emotion') return 'emotion';
    if (lowerName === 'material ui' || lowerName === 'mui') return 'materialui';
    
    // Testing
    if (lowerName === 'mocha') return 'mocha';
    if (lowerName === 'chai') return 'chai';
    if (lowerName === 'selenium') return 'selenium';
    if (lowerName === 'puppeteer') return 'puppeteer';
    if (lowerName === 'playwright') return 'playwright';

    // Other Tools
    if (lowerName === 'postman') return 'postman';
    if (lowerName === 'confluence') return 'confluence';
    if (lowerName === 'blender') return 'blender';
    if (lowerName === 'premiere pro' || lowerName === 'premiere') return 'premierepro';
    if (lowerName === 'rstudio') return 'rstudio';
    if (lowerName === 'eclipse') return 'eclipse';
    if (lowerName === 'webflow') return 'webflow';

    // PHP Ecosystem
    if (lowerName === 'composer') return 'composer';
    if (lowerName === 'symfony') return 'symfony';
    if (lowerName === 'codeigniter') return 'codeigniter';
    if (lowerName === 'cakephp') return 'cakephp';
    if (lowerName === 'doctrine') return 'doctrine';

    // Ruby Ecosystem
    if (lowerName === 'ruby') return 'ruby';
    if (lowerName === 'rubygems') return 'rubygems';

    // .NET Ecosystem
    if (lowerName === 'blazor') return 'blazor';
    if (lowerName === 'entity framework' || lowerName === 'ef') return 'entityframeworkcore';

    // More Databases
    if (lowerName === 'datagrip') return 'datagrip';
    if (lowerName === 'dbeaver') return 'dbeaver';
    if (lowerName === 'dynamodb' || lowerName === 'aws dynamodb') return 'dynamodb';
    if (lowerName === 'couchbase') return 'couchbase';
    
    // More Build Tools & CI/CD
    if (lowerName === 'gradle') return 'gradle';
    if (lowerName === 'maven') return 'maven';
    if (lowerName === 'ant') return 'ant';
    if (lowerName === 'teamcity') return 'teamcity';
    if (lowerName === 'azure devops') return 'azure'; // Azure icon
    if (lowerName === 'argocd' || lowerName === 'argo cd') return 'argocd';
    
    // Virtualization & Container Orchestration
    if (lowerName === 'virtualbox') return 'virtualbox';
    if (lowerName === 'docker compose') return 'docker';
    if (lowerName === ' vmware') return 'vmware';
    if (lowerName === 'openshift') return 'openshift';
    if (lowerName === 'rancher') return 'rancher';
    
    // Other Tools
    if (lowerName === 'putty') return 'putty';
    if (lowerName ===-"threejs" || lowerName === "three.js") return "threejs";
    if (lowerName === 'socket.io' || lowerName === 'socket io') return 'socketio';
    if (lowerName === 'markdown' || lowerName === 'md') return 'markdown';
    if (lowerName === 'docusaurus') return 'docusaurus';
    if (lowerName === 'apache spark' || lowerName === 'spark') return 'apachespark';
    if (lowerName === 'hadoop') return 'hadoop';
    if (lowerName === 'rpi') return 'raspberrypi'; // Alias


    // --- Step 3: Search 'name' and 'tags' fields ---
    // This is the fallback for anything not hardcoded
    const foundKey = Object.keys(iconMap).find(key => {
        const icon = iconMap[key];
        
        // A) The human-readable name includes the search term
        if (icon.name.toLowerCase().includes(lowerName)) {
            return true;
        }
        
        // B) Any of the tags include the search term
        if (icon.tags.some(tag => tag.toLowerCase().includes(lowerName))) {
            return true;
        }
        
        return false;
    });

    if (foundKey) {
        return foundKey;
    }

    return null; // No icon found
}

export function getIconCdnUrl(iconName) {
    if (!iconName) return null;
    
    const icon = iconMap[iconName];
    if (!icon) return null;

    // Default to 'original', but fall back if it doesn't exist
    let versionToUse = 'original';
    if (!icon.svgVersions.includes(versionToUse)) {
        versionToUse = icon.svgVersions[0];
    }
    
    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${iconName}/${iconName}-${versionToUse}.svg`;
}

/**
 * Gets the human-readable "pretty name" from an icon key
 * (e.g., "python" -> "Python")
 */
export function getHumanNameFromKey(iconName) {
    if (!iconName || !iconMap[iconName]) return null;
    return iconMap[iconName].name;
}