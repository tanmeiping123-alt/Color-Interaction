interface Props {
  onSave: () => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  hasTrails: boolean;
}

export default function Toolbar({ onSave, onUndo, onClear, canUndo, hasTrails }: Props) {
  return (
    <div className="toolbar">
      <button
        className="toolbar-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
      >
        ↩
      </button>
      <button
        className="toolbar-btn"
        onClick={onClear}
        disabled={!hasTrails}
        title="清空"
      >
        🗑
      </button>
      <button className="toolbar-btn" onClick={onSave} title="保存截图">
        💾
      </button>
    </div>
  );
}
