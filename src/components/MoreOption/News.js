// News.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNews } from '../Redux/newsSlice';

// MUI imports
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';

function News() {
  const dispatch = useDispatch();
  const { articles, status, error } = useSelector((state) => state.news);

  // Fetch news on component mount
  useEffect(() => {
    dispatch(fetchNews());
  }, [dispatch]);

  // Handler to refresh news
  const handleRefresh = () => {
    dispatch(fetchNews());
  };

  if (status === 'loading') {
    return <div>Loading news...</div>;
  }

  if (status === 'failed') {
    return <div>Error fetching news: {error}</div>;
  }

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 9999,
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '8px',            // <-- Rounded corners
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // <-- Subtle shadow
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h2 style={{ marginRight: '1rem' }}>Latest News</h2>
        <IconButton onClick={handleRefresh} aria-label="refresh">
          <RefreshIcon />
        </IconButton>
      </div>

      {articles.map((article, index) => (
        <div
          key={index}
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',  // Rounded corners for each news item
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fff',
          }}
        >
          <h3>{article.headline}</h3>
          <p>{article.summary}</p>
          {article.image && (
            <img
              src={article.image}
              alt={article.headline}
              style={{ maxWidth: '200px', display: 'block', margin: '1rem 0' }}
            />
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2' }}
          >
            Read more
          </a>
        </div>
      ))}
    </div>
  );
}

export default News;
