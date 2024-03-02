## Local Environment Setup

- [Git](https://git-scm.com/)
- [Node.js v18.16.0](https://nodejs.org/en/)
- [Docker](https://docs.docker.com/engine/install/)
- [Kubernetes](https://kubernetes.io/docs/setup/)
- [Ingress-nginx](https://kubernetes.github.io/ingress-nginx/deploy/)
- [Skaffold](https://skaffold.dev/docs/install/)
- [Visual Studio Code](https://code.visualstudio.com/)

## Run Locally

### 1. Environment Variables for Local Development

Check the .env.example file and set the secret following the below command.

```
$ kubectl create secret generic <SECRET_NAME> --from-literal <SECRET_KEY>=<SECRET_VALUE>
# example: kubectl create secret generic jwt-secret --from-literal JWT_KEY=asdf
```

### 2. Clone repo

```
$ git clone git@github.com:fahimjason/dh-observability-ninjas.git
$ cd little-programmer-task-main
$ skaffold dev
```

## API Documentation

To get the API documentation [Click Here](#)
