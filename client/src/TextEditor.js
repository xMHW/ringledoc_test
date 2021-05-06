import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import QuillCursors from 'quill-cursors';


const SOCKET_URL = "http://localhost:5000"

const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ align: [] }],
    ["image", "blockquote", "code-block"],
    ["clean"],
]

const SAVE_INTERVAL = 3000;

export default function TextEditor() {
    Quill.register('modules/cursors', QuillCursors);
    const { userId } = useParams();
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();
    const [docId, setDocId] = useState(1);
    const [cursors, setCursors] = useState();
    console.log(userId);


    useEffect(() => {
        const s = io(SOCKET_URL);
        setSocket(s);

        return () => {
            socket.disconnect();
        }
    },[])

    useEffect(() => {
        if (socket == null || quill == null) return;
        socket.once("load-document", doc => {
             quill.setContents(doc);
             quill.enable();
             const curs = quill.getModule('cursors');
             setCursors(curs);
        });

        socket.emit('get-document', docId);
    }, [socket, quill, docId])

    useEffect(() => {
        if(cursors == null) return;
        if(cursors.CreateCursor(userId.toString(), "mike", 'blue'));
    },[cursors])

    useEffect(() => {
        if (socket == null || quill == null) return;
        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;
            socket.emit("send-changes", delta);
        };
        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return;
        const handler = (range, oldRange, source) => {
            if (source !== 'user') return;
            socket.emit("send-cursor-changes", {range: range, source: source});
        };
        quill.on('selection-change', handler);

        return () => {
            quill.off('selection-change', handler);
        }
    }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return;
        const handler = (delta) => {
            quill.updateContents(delta);
        };
        socket.on('receive-changes', handler);

        return () => {
            socket.off('receive-changes', handler);
        }
    }, [socket, quill])
    
    useEffect(() => {
        if (socket == null || quill == null) return;
        
        const interval = setInterval(() => {
            socket.emit("save-document", quill.getContents());
        }, SAVE_INTERVAL);

        return () => {
            clearInterval(interval);
        }
    }, [socket, quill])
    
    const wrapperRef = useCallback(wrapper => {
        if(wrapper == null) return
        wrapper.innerHTML = "";
        const editor = document.createElement("div");
        wrapper.append(editor)
        const q = new Quill(editor, { theme: "snow", modules: {
            cursors: true,
            toolbar: TOOLBAR_OPTIONS }, })
            q.disable();
            q.setText("Wait a moment pls...");
            setQuill(q);
        }, [])
        return <div className="container" ref={wrapperRef}></div>
    }
    // cursors: {
    //     template: '<div class="custom-cursor">...</div>',
    //     hideDelayMs: 5000,
    //     hideSpeedMs: 0,
    //     selectionChangeSource: null,
    //     transformOnTextChange: true,
    //   }, 