import "babel-polyfill";

const User = {
    posts: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("blog");
        const collection = db.collection("posts");

        const result = parent.posts.forEach(async (obj) => {
            return await collection.findOne({_id: obj});
        });

        return result;
    }
}

export {User as default};