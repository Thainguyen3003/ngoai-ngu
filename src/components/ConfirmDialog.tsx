import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconTrash } from './Icons';

interface Props {
  title: string;
  message?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Hành động không hoàn tác được (xoá): nút xác nhận màu đỏ, có biểu tượng thùng rác */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Popup xác nhận thay cho window.confirm. Dùng <dialog> gốc của trình duyệt nên focus được giữ trong popup
 * và Esc tự đóng. Focus mặc định ở nút Huỷ để lỡ nhấn Enter cũng không xoá nhầm.
 */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel = 'Huỷ', danger, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      role="alertdialog"
      aria-labelledby={`${id}-t`}
      aria-describedby={message ? `${id}-m` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      // Chạm vào nền mờ bên ngoài (chính thẻ dialog, không phải phần nội dung) thì đóng
      onClick={(e) => e.target === ref.current && onCancel()}
    >
      <div className="dialog-in">
        {danger && (
          <span className="dialog-ic" aria-hidden="true">
            <IconTrash />
          </span>
        )}
        <h2 id={`${id}-t`}>{title}</h2>
        {message && (
          <div id={`${id}-m`} className="muted">
            {message}
          </div>
        )}
        <div className="dialog-actions">
          <button className="btn ghost" onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button className={`btn ${danger ? 'danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
