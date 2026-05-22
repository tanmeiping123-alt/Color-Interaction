interface Props {
  visible: boolean;
}

const prompts = [
  { icon: '📷', text: '双手拍照恢复原彩' },
  { icon: '✏️', text: '食指+中指并拢开始绘画' },
];

export default function PromptOverlay({ visible }: Props) {
  return (
    <div className={`prompt-overlay ${visible ? 'visible' : 'hidden'}`}>
      {prompts.map((p) => (
        <div key={p.text} className="prompt-item">
          <span className="prompt-icon">{p.icon}</span>
          <span>{p.text}</span>
        </div>
      ))}
    </div>
  );
}
