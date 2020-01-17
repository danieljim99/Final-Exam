import "babel-polyfill";
import { ObjectID } from "mongodb";

const Subscription = {
    subscribeAuthor: {
        subscribe: async (parent, args, context, info) => {
            const {email, token, author} = args;

            const {pubsub, client} = context;
            const db = client.db("blog");
            const collection = db.collection("users");

            if(!await collection.findOne({email, token})){
                throw new Error(`User not logged in.`);
            }

            if(!await collection.findOne({_id: ObjectID(author)})){
                throw new Error(`Author not found.`);
            }

            return pubsub.asyncIterator(author);
        },
    }
}

export {Subscription as default};