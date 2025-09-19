import React from 'react';
import { MindMapNodeData } from '../App';

interface MindMapNodeProps {
  node: MindMapNodeData;
}

const MindMapNode: React.FC<MindMapNodeProps> = ({ node }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="mind-map-node-container text-left inline-flex flex-col items-center justify-start">
      <div className="mind-map-node-content bg-neutral-800 border border-neutral-700 text-neutral-100 rounded-lg px-4 py-2 shadow-lg min-w-[150px] max-w-xs text-center">
        <p className="text-sm font-medium">{node.title}</p>
      </div>

      {hasChildren && (
        <>
          {/* Vertical connector line */}
          <div className="w-px h-8 bg-neutral-600"></div> 
          <ul className="mind-map-children-container flex items-start justify-center gap-x-8">
            {node.children?.map((child, index) => (
              <li key={index} className="mind-map-child-item flex flex-col items-center relative">
                 {/* Horizontal connector line */}
                 <div className="absolute top-0 left-0 right-0 h-px bg-neutral-600"></div>
                 {/* T-junction connector */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-neutral-600"></div>
                
                 {/* Remove horizontal line for the first and last child to avoid extending past the edges */}
                 {index === 0 && <div className="absolute top-0 left-0 right-1/2 h-px bg-[#121212]"></div>}
                 {index === (node.children?.length ?? 0) - 1 && <div className="absolute top-0 left-1/2 right-0 h-px bg-[#121212]"></div>}

                <MindMapNode node={child} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default MindMapNode;