import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import appGuideContent from '../../../APP_GUIDE.md?raw';

function Guide() {
  return (
    <div className="container" style={{ padding: '2rem' }}>
      <Link to="/" className="secondary-btn" style={{ marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Dashboard
      </Link>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <ReactMarkdown>
          {appGuideContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default Guide;
