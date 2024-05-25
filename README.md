# Distributed-Maps-Clone

The goal of this project is to develop a distributed systems maps clone. Given the geographical data of various regions, we are responisble for storing geographical data on a geographical supproted database and develop a backend server capable of making calls to our database. In subsequent distributions of the project, caching will be implemented in order to achieve QoS constraints.

This project was able to handle a QoS target requirement of 1600 requests per second (rps), with 95% of the requests responding under 50 ms. 

# Technologies Used:

- NodeJS
- ExpressJS
- MongoDB
- PostgreSQL
- Nginx
- Docker
- Memcached 


# Disclaimers:

## Disclaimer #1:

Users will have to downloaded the following onto their system in order to utilize the project:


- Docker 
- Docker-compose 


## Disclaimer #2:

Due to GitHub's size limit of 100 MBs and the need to use GitLFS, it is best to download the map data from the following website:


```
```

Once downloaded the intended .osm.pbf file, __place the file in the map-data folder__


# Running the program with single server instance

To run the program normally:

```
docker-compose -f docker-compose-first.yml up --build
docker-compose -f docker-compose-second.yml up --build
```

To run in detach mode (recommended):
```
docker-compose -f docker-compose-first.yml up --build -d
docker-compose -f docker-compose-second.yml up --build -d 
```

On your browser's search bar, type the following:

```
http://localhost:81/
```


# Running the program with multiple server instances

To run multiple instances of the backend server:

```
docker-compose -f docker-compose-second.yml --scale server={# of servers} up --build -d 
```

To run multiple instances of the tile server: 

```
docker-compose -f docker-compose-second.yml --scale tileserver={# of servers} up --build -d 
```

To run both, multiple instances of the backend server and tileserver, run: 

```
docker-compose -f docker-compose-second.yml --scale server={# of servers} --scale tileserver={# of servers} up --build -d 
```


# User Interation 

## User Forms 

- Create Account
    - Username (required): Input the intended username (can't use duplicate username)
    - Email (required): Input the intended email (can't use duplicate email)
    - Password (required): Input the intended password 

- Login
    - Username (required): Input an existing username
    - Password (required): Input an existing password

    After logging in, a __session is created for the user__. 

- Logout
    - If the user is logged in, they can press submit to logout and terminate the user session 

- User
    - If the user is logged in, they can press submit to gain information about their current session 


## Map Forms 

- Search 
    - Search Term (required): Input the name of the location you want to search 
    - Only-In-Box (required): This determines whether or not objects within the bounding box of the search term should be included or not. If set to true, then only objects within the query bbox are returned, with coordinates pointing to the center of the __VISIBLE PORTION__ of the object within the queried bounding box. If false, then coordinates are the center of the object and bbox is the bounding box that includes the entire object.

    A l

- Convert
    - Zoom (required): A __numerical value__ representing the zoom level 
    - Latitude (required) A __numerical value__ representing the latitude 
    - Longitude  (required) A __numerical value__ representing the longitude