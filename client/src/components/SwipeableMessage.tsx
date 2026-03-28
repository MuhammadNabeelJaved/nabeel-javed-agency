/**
 * SwipeableMessage
 *  - Swipe RIGHT (all messages) → onReply
 *  - Hover → reveals Reply button (+ Delete button for own messages)
 *
 * Renders as an inline-flex row so it never breaks parent max-w layout.
 * For isMe:   [delete] [reply] ←→ [bubble]   (flex-row-reverse)
 * For !isMe:  [bubble] ←→ [reply]
 */
import React, { useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Reply, Trash2 } from 'lucide-react';
import { ChatMessage } from '../api/chat.api';

interface Props {
    msg: ChatMessage;
    isMe: boolean;
    onReply: (msg: ChatMessage) => void;
    onDelete: (msgId: string) => void;
    children: React.ReactNode;
}

const THRESHOLD = 60;

export function SwipeableMessage({ msg, isMe, onReply, onDelete, children }: Props) {
    const x = useMotionValue(0);
    const [hovered, setHovered] = useState(false);
    const triggered = useRef(false);

    const onDragEnd = () => {
        if (x.get() >= THRESHOLD && !triggered.current) {
            triggered.current = true;
            onReply(msg);
        }
        triggered.current = false;
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 35 });
    };

    return (
        <div
            className={`inline-flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Bubble — draggable on touch/mouse */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: THRESHOLD + 10 }}
                dragElastic={{ left: 0, right: 0.25 }}
                dragMomentum={false}
                style={{ x }}
                onDragEnd={onDragEnd}
                className="touch-none select-text cursor-default min-w-0"
            >
                {children}
            </motion.div>

            {/* Action buttons — fade in on hover, always reserve space */}
            <div
                className={`flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
                    hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    onClick={() => onReply(msg)}
                    title="Reply"
                    className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                >
                    <Reply className="h-3 w-3" />
                </button>
                {isMe && !msg.isDeleted && (
                    <button
                        onClick={() => onDelete(msg._id)}
                        title="Delete"
                        className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}
