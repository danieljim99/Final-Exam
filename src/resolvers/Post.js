import "babel-polyfill";

const Post = {
    author: async (parent, args, context, info) => {
        const {client} = context;
        const db = client.db("blog");
        const collection = db.collection("users");

        return await collection.findOne({_id: parent.author});
    }
}

export {Post as default};