# LiReddit

LiReddit is an in-depth implementation of creating a full-stack application based on the original Reddit website with user sign-up and sign-in, password recovery, and CRUD methods on posts. The UI is implemented utilizing React.js and Chakra. The backend is built using three different services that run as one service using Docker-Compose. PostgreSQL is the choice of database while Redis is utilized as a key-store. The server is created using Express.js and GraphQL. Next.js provided the ability to pre-render pages. Pages that are dynamic use server-side rendering while pages that are less likely to change such as forgot-password use static generation. More is to be completed as there is still the option of deploying live, creating rooms, and profile pages to be added. The application was built with the PERN Stack. 🔥

Demo image of UI:
![lireddit-ui](/client/src/assets/screenshotForLireddit.png)

## Run Locally

Make sure to have the following installed on your machine:

- PostgreSQL
- Docker
- Redis

### Starting the Server

Navigate to lireddit/server

Build and run the app with
`docker-compose up -d`
this will start the server on [localhost:8080/graphql](http://localhost:8080/graphql)

### Starting the Frontend

Navigate to lireddit/client

Create a .env file like this:
`NEXT_PUBLIC_API_URL: http://localhost:8080/graphql`

run
`yarn add`
`yarn dev`

navigate to [localhost:3000](http://localhost:3000) to see the app!
