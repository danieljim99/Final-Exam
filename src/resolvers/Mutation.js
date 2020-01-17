import "babel-polyfill";
import uuid from "uuid";
import { ObjectID } from "mongodb";

const Mutation = {
    register: async (parent, args, context, info) => {
        const {email, password, author} = args;

        const {client} = context;
        const db = client.db("blog");
        const collection = db.collection("users");

        if(await collection.findOne({email})){
            throw new Error(`The email ${email} is already in use.`);
        }

        const user = {
            email,
            password,
            author,
            token: "",
            posts: [],
        };

        return (await collection.insertOne(user)).ops[0];
    },

    login: async (parent, args, context, info) => {
        const {email, password} = args;

        const {client} = context;
        const db = client.db("blog");
        const collection = db.collection("users");

        const user = await collection.findOneAndUpdate({email, password}, {$set: {token: uuid.v4()}}, {returnOriginal: false});

        if(!user.value){
            throw new Error(`email/password combination not found.`);
        }

        setTimeout(() => {
            collection.findOneAndUpdate({email, password}, {$set: {token: ""}});
        }, 1800000);

        return user.value;
    },

    logout: async (parent, args, context, info) => {
        const {email, token} = args;

        const {client} = context;
        const db = client.db("blog");
        const collection = db.collection("users");

        const user = await collection.findOneAndUpdate({email, token}, {$set: {token: ""}}, {returnOriginal: false});

        if(!user.value){
            throw new Error(`User not logged in.`);
        }

        return user.value;
    },

    publish: async (parent, args, context, info) => {
        const {email, token, title, description} = args;

        const {client, pubsub} = context;
        const db = client.db("blog");
        const usersCollection = db.collection("users");
        const postsCollection = db.collection("posts");

        const user = await usersCollection.findOne({email, token});

        if(!user){
            throw new Error(`User not logged in.`);
        }

        if(!user.author){
            throw new Error(`You must be an author to publish.`);
        }

        const post = {
            title,
            description,
            author: user._id,
        };

        const result = await postsCollection.insertOne(post);

        await usersCollection.findOneAndUpdate({email, token}, {$set: {posts: user.posts.concat(result.ops[0]._id)}});

        pubsub.publish(user._id, {subscribeAuthor: `${user.email} has a new post.`});

        return result.ops[0];
    },

    removePost: async (parent, args, context, info) => {
        const {email, token, post} = args;

        const {client} = context;
        const db = client.db("blog");
        const usersCollection = db.collection("users");
        const postsCollection = db.collection("posts");

        const user = await usersCollection.findOne({email, token});

        const result = await postsCollection.findOneAndDelete({author: user._id, _id: ObjectID(post)});

        if(!user){
            throw new Error(`User not logged in.`);
        }

        if(!result.value){
            throw new Error(`Post not found or not your post.`);
        }

        user.posts.splice(user.posts.indexOf(result._id), 1);

        await usersCollection.findOneAndUpdate({email, token}, {$set: {posts: user.posts}});

        return result.value;
    },

    removeUser: async (parent, args, context, info) => {
        const {email, token} = args;

        const {client} = context;
        const db = client.db("blog");
        const usersCollection = db.collection("users");
        const postsCollection = db.collection("posts");

        const user = await usersCollection.findOneAndDelete({email, token});

        if(!user.value){
            throw new Error(`User not logged in.`);
        }

        await postsCollection.deleteMany({author: ObjectID(user.value._id)});

        return user.value;
    },
}

export {Mutation as default};