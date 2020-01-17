import "babel-polyfill";
import { ObjectID } from "mongodb";

const Query = {
    searchPosts: async (parent, args, context, info) => {
        const {email, token, post, author} = args;

        const {client} = context;
        const db = client.db("blog");
        const usersCollection = db.collection("users");
        const postsCollection = db.collection("posts");

        const user = await usersCollection.findOne({email, token});

        if(!user){
            throw new Error(`User not logged in.`);
        }

        let result = [];

        if(post && author){
            const postAuthorFind = await postsCollection.findOne({_id: ObjectID(post), author: ObjectID(author)});
            result.push(postAuthorFind);
        } else if(post){
            const postFind = await postsCollection.findOne({_id: ObjectID(post)});
            result.push(postFind);
        } else if(author){
            result = await postsCollection.find({author: ObjectID(author)}).toArray();
        } else {
            result = await postsCollection.find({}).toArray();
        }

        return result;
    },
}

export {Query as default};