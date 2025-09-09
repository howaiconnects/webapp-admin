'use client';

import React, { useState } from 'react';
import Breadcrumb from '../../../src/components/Breadcrumb';
import Card from '../../../src/components/Card';
import DataTable from '../../../src/components/DataTable';
import Chart from '../../../src/components/Chart';
import Form from '../../../src/components/Form';

export default function EcommerceDashboard() {
  const [productDescription, setProductDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDescriptionGeneration = async (data: Record<string, string>) => {
    setIsGenerating(true);
    setTimeout(() => {
      setProductDescription(`Introducing the ${data.productName} - ${data.description}\n\nThis premium product features:\n• High-quality materials\n• Innovative design\n• Perfect for ${data.targetAudience}\n• Available in multiple colors\n\nPrice: $${data.price} | Category: ${data.category}`);
      setIsGenerating(false);
    }, 2000);
  };

  const productData = [
    { id: 1, name: 'Wireless Headphones', price: 199.99, stock: 45, sales: 120 },
    { id: 2, name: 'Smart Watch', price: 299.99, stock: 23, sales: 89 },
    { id: 3, name: 'Laptop Stand', price: 49.99, stock: 67, sales: 234 },
    { id: 4, name: 'USB Cable', price: 14.99, stock: 156, sales: 445 }
  ];

  const productColumns = [
    { key: 'name', label: 'Product Name', sortable: true },
    { key: 'price', label: 'Price', sortable: true },
    { key: 'stock', label: 'Stock', sortable: true },
    { key: 'sales', label: 'Sales', sortable: true }
  ];

  const salesData = [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1500 },
    { label: 'Wed', value: 1800 },
    { label: 'Thu', value: 1400 },
    { label: 'Fri', value: 2100 },
    { label: 'Sat', value: 2800 },
    { label: 'Sun', value: 1900 }
  ];

  return (
    <div className="p-8">
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'eCommerce Dashboard' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary-light">
          eCommerce Dashboard
        </h1>
        <p className="text-lg text-secondary-light">
          Manage products, generate descriptions, and monitor pricing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Product Descriptions */}
        <Card title="AI Product Descriptions" className="lg:col-span-1">
          <Form
            fields={[
              {
                name: 'productName',
                label: 'Product Name',
                type: 'text',
                placeholder: 'Wireless Headphones',
                required: true
              },
              {
                name: 'description',
                label: 'Product Description',
                type: 'textarea',
                placeholder: 'Brief description of the product...',
                required: true
              },
              {
                name: 'price',
                label: 'Price',
                type: 'text',
                placeholder: '199.99',
                required: true
              },
              {
                name: 'category',
                label: 'Category',
                type: 'text',
                placeholder: 'Electronics',
                required: true
              },
              {
                name: 'targetAudience',
                label: 'Target Audience',
                type: 'text',
                placeholder: 'Tech enthusiasts',
                required: false
              }
            ]}
            onSubmit={handleDescriptionGeneration}
            submitLabel={isGenerating ? 'Generating...' : 'Generate Description'}
          />

          {productDescription && (
            <div className="mt-4 p-4 bg-neutral-50 dark:bg-dark-3 rounded-md">
              <h4 className="font-semibold mb-2 text-primary-light dark:text-white">Generated Description:</h4>
              <pre className="text-sm text-secondary-light dark:text-neutral-300 whitespace-pre-wrap">
                {productDescription}
              </pre>
            </div>
          )}
        </Card>

        {/* Sales Chart */}
        <Card title="Sales Performance" className="lg:col-span-1">
          <Chart
            data={salesData}
            type="bar"
            title="Daily Sales ($)"
          />
        </Card>
      </div>

      {/* Product Catalog */}
      <Card title="Product Catalog" className="mb-6">
        <DataTable
          columns={productColumns}
          data={productData}
        />
      </Card>

      {/* eCommerce Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Price Monitoring">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-secondary-light dark:text-neutral-400">
              Monitor competitor prices automatically
            </p>
            <button className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors">
              Start Monitoring
            </button>
          </div>
        </Card>

        <Card title="Visual Merchandising">
          <div className="text-center">
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🖼️</span>
            </div>
            <p className="text-secondary-light dark:text-neutral-400">
              Generate product images and visuals
            </p>
            <button className="mt-4 bg-success-600 text-white px-4 py-2 rounded-md hover:bg-success-700 transition-colors">
              Create Visuals
            </button>
          </div>
        </Card>

        <Card title="Inventory Alerts">
          <div className="text-center">
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-secondary-light dark:text-neutral-400">
              Automated low stock notifications
            </p>
            <button className="mt-4 bg-warning-600 text-white px-4 py-2 rounded-md hover:bg-warning-700 transition-colors">
              Set Alerts
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}