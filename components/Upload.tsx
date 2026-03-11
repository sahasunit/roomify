import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';
import {
    PROGRESS_INTERVAL_MS,
    PROGRESS_STEP,
    REDIRECT_DELAY_MS,
} from 'lib/contants';

type UploadProps = {
    onComplete?: (base64: string) => void;
};

const ACCEPT_TYPES = '.jpg,.jpeg,.png';

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const processFile = useCallback(
        (selectedFile: File) => {
            if (!isSignedIn) return;

            setFile(selectedFile);
            setProgress(0);

            const reader = new FileReader();
            reader.onerror = () => {
                console.error('File reading failed');
                setFile(null);
                setProgress(0);
            };
            reader.onload = () => {
                const base64 = typeof reader.result === 'string' ? reader.result : '';
                progressIntervalRef.current = setInterval(() => {
                    setProgress((prev) => {
                        const next = Math.min(prev + PROGRESS_STEP, 100);
                        if (next >= 100 && progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                            redirectTimeoutRef.current = setTimeout(() => {
                                redirectTimeoutRef.current = null;
                                onComplete?.(base64);
                            }, REDIRECT_DELAY_MS);
                        }
                        return next;
                    });
                }, PROGRESS_INTERVAL_MS);
            };
            reader.readAsDataURL(selectedFile);
        },
        [isSignedIn, onComplete]
    );

    const onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!isSignedIn || !files?.length) return;
            processFile(files[0]);
            e.target.value = '';
        },
        [isSignedIn, processFile]
    );

    const onDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (!isSignedIn) return;
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles?.length) {
                const first = droppedFiles[0];
                const accepted = ACCEPT_TYPES.split(',').some((ext) =>
                    first.name.toLowerCase().endsWith(ext.trim().replace('.', ''))
                );
                if (accepted) processFile(first);
            }
        },
        [isSignedIn, processFile]
    );

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
                redirectTimeoutRef.current = null;
            }
        };
    }, []);

    return (
        <div className='upload'>
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragEnter={onDragEnter}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <input
                        type="file"
                        className='drop-input'
                        accept={ACCEPT_TYPES}
                        disabled={!isSignedIn}
                        onChange={onChange}
                    />

                    <div className='drop-content'>
                        <div className='drop-icon'>
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn
                                ? 'Click to upload or just drag and drop'
                                : 'Sign in or sign up with Puter to upload'}
                        </p>
                        <p className='help'>
                            Maximum file size 50 MB.
                        </p>
                    </div>
                </div>
            ) : (
                <div className='upload-status'>
                    <div className='status-content'>
                        <div className='status-icon'>
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className='image' />
                            )}
                        </div>
                        <h3>{file.name}</h3>
                        <div className='progress'>
                            <div className='bar' style={{ width: `${progress}%` }} />
                            <p className='status-text'>
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload