import React from 'react';
import './SkeletonCard.css';

export default function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line badge"></div>
            </div>
            <div className="skeleton-body">
                <div className="skeleton-line info"></div>
                <div className="skeleton-line info short"></div>
            </div>
            <div className="skeleton-footer">
                <div className="skeleton-circle"></div>
                <div className="skeleton-btn"></div>
                <div className="skeleton-circle"></div>
            </div>
        </div>
    );
}