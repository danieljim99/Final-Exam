import {MongoClient} from 'mongodb';
import {GraphQLServer, PubSub} from "graphql-yoga";
import Query from './resolvers/Query.js';
import Mutation from './resolvers/Mutation.js';
import Subscription from './resolvers/Subscription.js';
import User from './resolvers/User.js';
import Post from './resolvers/Post.js';
import "babel-polyfill";

const url = "mongodb+srv://username:password99@thecluster-mzag5.gcp.mongodb.net/test";

const dbConnect = async function(url) {
    const client = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology: true});
    await client.connect();
    return client;
};

const runGraphQLServer = (context) => {
    const resolvers = {
        Query,
        Mutation,
        Subscription,
        User,
        Post,
    };
    const server = new GraphQLServer({
        typeDefs: './src/schema.graphql',
        resolvers,
        context,
    });
    server.start(() => console.log("Server started"));
};

const runApp = async() => {
    const client = await dbConnect(url);
    const pubsub = new PubSub();
    try {
        runGraphQLServer({client, pubsub});
    } catch(e) {
        console.log(e);
        client.close();
    }
};

runApp();