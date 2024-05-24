# Distributed-Maps-Clone

The goal of this project is to develop a distributed systems maps clone. Given the geographical data of various regions, we are responisble for storing geographical data on a geographical supproted database and develop a backend server capable of making calls to our database. In subsequent distributions of the project, caching will be implemented in order to achieve QoS constraints.

This project was able to handle a QoS target requirement of 1600 requests per second (rps), wit 95% of the requests responding under 50 ms. 

# Technologies Used:

- NodeJS
- ExpressJS
- MongoDB
- PostgreSQL
- Nginx
- Docker
- Memcached 


# Disclaimers:


Users will have to downloaded the following onto their system in order to utilize the project:


- Docker 
- Node 
- NPM 


Due to GitHub's 


# Installation/Usage

Will come to this later 


# Running the program with single instance

To run:

```
docker-compose -f docker-compose-first.yml up 
docker-compose -f docker-compose-second.yml up 
```

To run in detach mode:
```
docker-compose -f docker-compose-first.yml up -d
docker-compose -f docker-compose-second.yml up -d 
```

On your browser's search bar, type the following:

```
http://localhost:81/
```

You can now see the project and interact with the forms provied

# Running the program with multiple instances

To run multiple instances of the backend server:

```
docker-compose -f docker-compose-second.yml --scale server={# of servers} up -d 
```

To run multiple instances of the tile server: 

```
docker-compose -f docker-compose-second.yml --scale tileserver={# of servers} up -d 
```

To run both, multiple instances of the backend server and tileserver, run: 

```
docker-compose -f docker-compose-second.yml --scale server={# of servers} --scale tileserver={# of servers} up -d 
```

