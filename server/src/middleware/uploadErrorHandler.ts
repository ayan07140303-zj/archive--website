import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

/**
 * 封装 multer middleware，捕获 "Unexpected field" 等错误转为 JSON 响应
 * 用法: router.post('/path', uploadErrorHandler(upload.array('files', 10)), handler)
 */
export function uploadErrorHandler(uploadMiddleware: (req: Request, res: Response, next: NextFunction) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    uploadMiddleware(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            res.status(422).json({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: `文件上传字段不匹配，请使用 "attachments" 作为表单字段名` },
            });
            return;
          }
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(422).json({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '文件过大，单文件限制 50MB' },
            });
            return;
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(422).json({
              success: false,
              error: { code: 'VALIDATION_ERROR', message: '文件数量超过上限（最多 20 个附件）' },
            });
            return;
          }
        }
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: err.message || '文件上传失败' },
        });
        return;
      }
      next();
    });
  };
}
