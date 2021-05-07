const mongoose = require('mongoose');
const Document = require('./models/doc');

mongoose.connect('mongodb://localhost/coledit', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});

const defaultValue = "";

const io = require('socket.io')(5000, {
    cors: {
        origin: '*',
        method: ['GET', 'POST']
    }
});

io.on("connection", socket => {

    socket.on("get-document", async (docId) => {
        const document = await findOrCreateDocument(docId);
        let cursors = {};
        socket.join(docId);
        socket.emit("load-document", document.data);

        socket.on("send-changes", delta => {
            socket.broadcast.to(docId).emit("receive-changes", delta);
        });
        
        socket.on("send-cursor-changes", rangemap => {
            console.log(rangemap);
            cursors[rangemap.id] = rangemap.range;
            socket.broadcast.to(docId).emit("receive-cursor-changes", cursors);

        });

        socket.on("save-document", async (data) => {
            await Document.findByIdAndUpdate(docId, { data })
        })

    })


});

const findOrCreateDocument = async (id) => {
    if (id == null) return;

    const document = await Document.findById(id);
    if(document) return document;
    return await Document.create({_id: id, data: defaultValue});
}