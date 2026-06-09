import React, { useState } from 'react';
import { Upload, Card, Typography, Alert, Tag, Descriptions, Progress, Space, Spin } from 'antd';
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface StepResult {
  step: number;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  score: number;
  message: string;
  durationMs: number;
}

interface VerifyResult {
  valid: boolean;
  hash: string;
  overallScore: number;
  overallStatus: 'pass' | 'fail' | 'warning' | 'skipped';
  steps: StepResult[];
  verifiedAt: string;
}

const STATUS_CONFIG = {
  pass: { color: 'success', icon: <CheckCircleOutlined />, label: 'PASS' },
  fail: { color: 'error', icon: <CloseCircleOutlined />, label: 'FAIL' },
  warning: { color: 'warning', icon: <ExclamationCircleOutlined />, label: 'WARN' },
  skipped: { color: 'default', icon: <MinusCircleOutlined />, label: 'SKIP' },
};

export default function SlipVerify() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const verify = useMutation({
    mutationFn: (base64: string) => api.post('/slip/verify', { imageBase64: base64 }).then(r => r.data),
    onSuccess: (data: VerifyResult) => setResult(data),
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const b64 = (e.target?.result as string).split(',')[1];
      verify.mutate(b64);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const overallColor = result
    ? result.overallStatus === 'pass' ? '#52c41a'
      : result.overallStatus === 'warning' ? '#faad14'
      : '#ff4d4f'
    : undefined;

  return (
    <Card>
      <Title level={4}>Slip Verification</Title>
      <Dragger beforeUpload={handleFile} showUploadList={false} accept="image/*" style={{ marginBottom: 24 }}>
        <p><InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} /></p>
        <p>Click or drag a payment slip image to verify</p>
        <p style={{ color: '#888' }}>9-step verification pipeline: OCR, bank cross-ref, duplicate detection, logo, tamper, amount, datetime, sender, PromptPay ref</p>
      </Dragger>

      {verify.isPending && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin size="large" />
          <p style={{ marginTop: 12, color: '#666' }}>Running 9-step verification pipeline...</p>
        </div>
      )}

      {result && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Overall Result */}
          <Alert
            message={result.valid ? 'Slip Accepted' : 'Slip Rejected'}
            description={
              <div>
                <Text>Overall Score: </Text>
                <Text strong style={{ fontSize: 18, color: overallColor }}>{result.overallScore}/100</Text>
                <br />
                <Text copyable style={{ fontSize: 12 }}>Hash: {result.hash}</Text>
              </div>
            }
            type={result.valid ? 'success' : 'error'}
            showIcon
          />

          {/* Score Gauge */}
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="dashboard"
              percent={result.overallScore}
              strokeColor={overallColor}
              format={percent => `${percent}`}
            />
          </div>

          {/* Per-Step Results */}
          <Card title="Verification Steps" size="small">
            {result.steps.map(step => {
              const config = STATUS_CONFIG[step.status];
              return (
                <div key={step.step} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: 30, fontWeight: 600, color: '#666' }}>{step.step}.</div>
                  <div style={{ flex: 1 }}>
                    <Text strong>{step.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{step.message}</Text>
                  </div>
                  <div style={{ width: 80, textAlign: 'right' }}>
                    <Tag color={config.color} icon={config.icon}>{config.label}</Tag>
                  </div>
                  <div style={{ width: 50, textAlign: 'right' }}>
                    <Text style={{ fontSize: 12 }}>{step.score}%</Text>
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Timestamp */}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Verified at: {new Date(result.verifiedAt).toLocaleString()}
          </Text>
        </Space>
      )}

      {verify.isError && <Alert message="Verification failed" description="An error occurred during slip verification" type="error" />}
    </Card>
  );
}
