import React from 'react';
import { useNavigate } from 'react-router';
import styles from './PendingRequests.module.css';

export default function PendingRequests({ requests, onDecision }) {
  const navigate = useNavigate();

  return (
    <section className={styles.requestsSection}>
      <h3>Friend Requests</h3>
      {requests.length === 0 ? (
        <p className={styles.empty}>No pending requests.</p>
      ) : (
        <div className={styles.requestsList}>
          {requests.map(req => (
            <div key={req.id} className={styles.requestCard}>
              <img 
                src={req.sender?.avatarUrl} 
                alt="" 
                className={styles.requestAvatar}
              />
              <div className={styles.requestMeta} onClick={() => navigate(`/profile/${req.sender?.username}`)}>
                <span className={styles.reqName}>{req.sender?.displayName || req.sender?.username}</span>
                <span className={styles.reqHandle}>@{req.sender?.username}</span>
              </div>
              <div className={styles.requestActions}>
                <button onClick={() => onDecision(req.id, req.sender, 'ACCEPTED')} className={styles.btnAccept}>Accept</button>
                <button onClick={() => onDecision(req.id, req.sender, 'REJECTED')} className={styles.btnDecline}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
