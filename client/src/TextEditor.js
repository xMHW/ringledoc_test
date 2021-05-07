import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import QuillCursors from 'quill-cursors';


const SOCKET_URL = "http://localhost:5000"

const CURSOR_LATENCY = 100;

const COLORS = ['#FF385C', '#442dc9', '#28b496']

//442dc9
//ff3051

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
        });

        socket.emit('get-document', docId);
    }, [socket, quill, docId])

    // useEffect(() => {
    //     if(cursors == null) return;
    //     // if(cursors.CreateCursor(userId.toString(), "mike", 'blue'));
    // },[cursors])

    const updateCursor = (source, range) => {
        setTimeout(() => cursors.moveCursor(source, range), CURSOR_LATENCY);
    }

    useEffect(() => {
        if (socket == null || quill == null) return;
        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;
            socket.emit("send-changes", delta);
        };
        const cursorHandler = (range, oldRange, source) => {
            // if (source !== userId.toString()) return;
            socket.emit("send-cursor-changes", {range: range, id: userId});
        }

        quill.on('text-change', handler);
        quill.on('selection-change', cursorHandler);

        return () => {
            quill.off('text-change', handler);
            quill.off('selection-change', cursorHandler);
        }
    }, [socket, quill])

    // useEffect(() => {
    //     if (socket == null || quill == null) return;
    //     const handler = (range, oldRange, source) => {
    //         if (source !== 'user') return;
    //         socket.emit("send-cursor-changes", {range: range, source: source});
    //     };
    //     quill.on('selection-change', handler);

    //     return () => {
    //         quill.off('selection-change', handler);
    //     }
    // }, [socket, quill])

    useEffect(() => {
        if (socket == null || quill == null) return;
        const handler = (delta) => {
            quill.updateContents(delta);
        };
        const cursorHandler = (cursormap) => {
            Object.keys(cursormap).forEach((source) => {
                cursors.createCursor(source, source, COLORS[parseInt(source)]);
                updateCursor(source, cursormap[source]);
                console.log('---')
                console.log(source);
                console.log(cursormap)
            });
        };
        socket.on('receive-changes', handler);
        socket.on('receive-cursor-changes', cursorHandler);

        return () => {
            socket.off('receive-changes', handler);
            socket.off('receive-cursor-changes', cursorHandler);
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
            cursors: {
                hideDelayMs: 5000,
                hideSpeedMs: 0,
                selectionChangeSource: null,
                transformOnTextChange: true,
            }, 
            toolbar: TOOLBAR_OPTIONS }, });
            const cq = q.getModule('cursors');
            // cq.createCursor('1','mike','skyblue');
            q.disable();
            q.setText("Wait a moment pls...");
            setQuill(q);
            setCursors(cq);
        }, [])
        return <div className="container" ref={wrapperRef}></div>
    }
    
    // cursors: true,
    // template: '<div class="custom-cursor">...</div>',