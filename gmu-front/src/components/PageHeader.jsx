import React from 'react';
import PropTypes from 'prop-types';

const PageHeader = ({ title, description, children }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-gray-600 max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex space-x-3">
            {children}
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-gray-200"></div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
};

export default PageHeader;