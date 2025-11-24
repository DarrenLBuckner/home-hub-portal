import * as React from 'react';

interface VisitorConfirmationEmailProps {
  visitorName: string;
  propertyTitle: string;
  propertyLocation: string;
  listingUserName: string;
  listingUserEmail: string;
  listingUserPhone: string;
  listingUserCompany: string | null;
}

export function VisitorConfirmationEmail({
  visitorName,
  propertyTitle,
  propertyLocation,
  listingUserName,
  listingUserEmail,
  listingUserPhone,
  listingUserCompany
}: VisitorConfirmationEmailProps) {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thank you for your interest in {propertyTitle}</title>
        <style>
          {`
            @media only screen and (max-width: 600px) {
              .container { width: 95% !important; }
              .content { padding: 20px 15px !important; }
              .header-title { font-size: 20px !important; }
              .property-title { font-size: 18px !important; }
            }
          `}
        </style>
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f8fafc',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff'
        }} className="container">
          {/* Header */}
          <div style={{
            backgroundColor: '#2563eb',
            padding: '30px 20px',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#ffffff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }} className="header-title">
              Guyana Home Hub
            </h1>
            <p style={{
              color: '#bfdbfe',
              margin: '5px 0 0 0',
              fontSize: '14px'
            }}>
              Your trusted property partner
            </p>
          </div>

          {/* Main Content */}
          <div style={{
            padding: '40px 30px'
          }} className="content">
            <h2 style={{
              color: '#2563eb',
              fontSize: '22px',
              marginBottom: '20px',
              fontWeight: 'bold'
            }} className="property-title">
              Thank you for your interest!
            </h2>

            <p style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Hi {visitorName},
            </p>

            <p style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '25px'
            }}>
              Thank you for your interest in viewing our property. We've received your request and our team will be in touch with you soon to arrange a viewing time that works for you.
            </p>

            {/* Property Details Box */}
            <div style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '25px'
            }}>
              <h3 style={{
                color: '#2563eb',
                fontSize: '18px',
                margin: '0 0 10px 0',
                fontWeight: 'bold'
              }}>
                Property Details
              </h3>
              <p style={{
                color: '#374151',
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 5px 0'
              }}>
                {propertyTitle}
              </p>
              <p style={{
                color: '#6b7280',
                fontSize: '14px',
                margin: 0
              }}>
                📍 {propertyLocation}
              </p>
            </div>

            {/* Agent Contact Info */}
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #d1fae5',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: '#059669',
                fontSize: '16px',
                margin: '0 0 15px 0',
                fontWeight: 'bold'
              }}>
                Your Agent Contact
              </h3>
              <p style={{
                color: '#374151',
                fontSize: '16px',
                fontWeight: 'bold',
                margin: '0 0 8px 0'
              }}>
                {listingUserName}
              </p>
              {listingUserCompany && (
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  margin: '0 0 8px 0'
                }}>
                  {listingUserCompany}
                </p>
              )}
              <p style={{
                color: '#374151',
                fontSize: '14px',
                margin: '0 0 5px 0'
              }}>
                📧 {listingUserEmail}
              </p>
              <p style={{
                color: '#374151',
                fontSize: '14px',
                margin: 0
              }}>
                📞 {listingUserPhone}
              </p>
            </div>

            <p style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '30px'
            }}>
              We'll contact you within 24 hours to schedule your viewing. If you have any urgent questions, please don't hesitate to reach out to your agent directly using the contact information above.
            </p>

            <p style={{
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              Thank you for choosing Guyana Home Hub!
            </p>
          </div>

          {/* Footer */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '25px 30px',
            textAlign: 'center',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: '12px',
              margin: '0 0 10px 0'
            }}>
              © 2024 Guyana Home Hub. All rights reserved.
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '12px',
              margin: 0
            }}>
              Visit us at{' '}
              <a href="https://guyanahomehub.com" style={{
                color: '#2563eb',
                textDecoration: 'none'
              }}>
                guyanahomehub.com
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}