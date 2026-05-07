import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI' }}>
      <h1 style={{ color: '#d9534f' }}>XSS Vulnerable Lab (DevSecOps Demo 2026)</h1>
      <p><i>Lưu ý: Đây là mã nguồn cố tình chứa lỗi để thực hành pentest[cite: 18].</i></p>
      <hr />
      <ReflectedXSS />
      <hr />
      <StoredXSS />
      <hr />
      <DOMBasedXSS />
    </div>
  );
}

// 1. COMPONENT REFLECTED XSS
function ReflectedXSS() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');

  const handleSearch = async () => {
    const res = await axios.get(`http://localhost:3001/api/search?q=${query}`);
    setResult(res.data.result);
  };

  return (
    <section>
      <h3>Type 1: Reflected XSS</h3>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập từ khóa..." />
      <button onClick={handleSearch}>Tìm kiếm</button>
      {/* LỖ HỔNG: Sử dụng dangerouslySetInnerHTML để render mã độc */}
      <div style={{ background: '#f4f4f4', padding: '10px', marginTop: '5px' }} 
           dangerouslySetInnerHTML={{ __html: result }} />
    </section>
  );
}

// 2. COMPONENT STORED XSS
function StoredXSS() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const fetchComments = async () => {
    const res = await axios.get('http://localhost:3001/api/comments');
    setComments(res.data);
  };

  useEffect(() => { fetchComments(); }, []);

  const handlePost = async () => {
    await axios.post('http://localhost:3001/api/comments', { text: newComment });
    setNewComment('');
    fetchComments();
  };

  return (
    <section>
      <h3>Type 2: Stored XSS</h3>
      <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Để lại bình luận..." />
      <br /><button onClick={handlePost}>Đăng tin</button>
      <ul>
        {comments.map((c) => (
          // LỖ HỔNG: Hiển thị trực tiếp script từ Database
          <li key={c.id} dangerouslySetInnerHTML={{ __html: c.text }} />
        ))}
      </ul>
    </section>
  );
}

// 3. COMPONENT DOM-BASED XSS
function DOMBasedXSS() {
  const [hashData, setHashData] = useState(window.location.hash.substring(1));

  useEffect(() => {
    const handleHashChange = () => setHashData(window.location.hash.substring(1));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <section>
      <h3>Type 3: DOM-based XSS</h3>
      <p>Thử thêm <code>#&lt;img src=x onerror=alert(1)&gt;</code> vào URL</p>
      {/* LỖ HỔNG: Frontend tự lấy dữ liệu từ URL và thực thi ngay lập tức */}
      <div style={{ border: '1px dashed red', padding: '10px' }}
           dangerouslySetInnerHTML={{ __html: decodeURIComponent(hashData) }} />
    </section>
  );
}

export default App;