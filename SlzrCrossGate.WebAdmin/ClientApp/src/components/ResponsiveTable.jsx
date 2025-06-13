import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box
} from '@mui/material';

/**
 * 响应式表格组件
 * 支持横向滚动和智能固定操作列
 */
const ResponsiveTable = ({
  children,
  minWidth = 800,
  stickyActions = false,
  ...props
}) => {
  const [hasScroll, setHasScroll] = React.useState(false);
  const containerRef = React.useRef(null);

  // 检测是否有横向滚动条
  React.useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current) {
        const { scrollWidth, clientWidth } = containerRef.current;
        setHasScroll(scrollWidth > clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    // 使用 MutationObserver 监听表格内容变化
    const observer = new MutationObserver(checkScroll);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <TableContainer
      ref={containerRef}
      component={Paper}
      sx={{
        overflowX: 'auto',
        position: 'relative',
        // 当需要固定操作列且有滚动条时的样式
        ...(stickyActions && hasScroll && {
          '& .sticky-actions': {
            position: 'sticky',
            right: 0,
            backgroundColor: 'background.paper',
            zIndex: 1,
            boxShadow: (theme) => `-2px 0 4px ${theme.palette.divider}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: -1,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'divider'
            }
          }
        }),
        // 当没有滚动条时，移除固定样式
        ...(stickyActions && !hasScroll && {
          '& .sticky-actions': {
            position: 'static',
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&::before': {
              display: 'none'
            }
          }
        })
      }}
    >
      <Table
        sx={{
          minWidth,
          // 确保表格布局稳定
          tableLayout: 'auto'
        }}
        {...props}
      >
        {children}
      </Table>
    </TableContainer>
  );
};

/**
 * 响应式表格头组件
 */
export const ResponsiveTableHead = ({ children, ...props }) => {
  return (
    <TableHead {...props}>
      {children}
    </TableHead>
  );
};

/**
 * 响应式表格体组件
 */
export const ResponsiveTableBody = ({ children, ...props }) => {
  return (
    <TableBody {...props}>
      {children}
    </TableBody>
  );
};

/**
 * 响应式表格行组件
 */
export const ResponsiveTableRow = ({ children, ...props }) => {
  return (
    <TableRow {...props}>
      {children}
    </TableRow>
  );
};

/**
 * 响应式表格单元格组件
 * 支持响应式显示/隐藏
 */
export const ResponsiveTableCell = ({
  children,
  hideOn = [], // 在哪些断点隐藏 ['xs', 'sm', 'md', 'lg', 'xl']
  sticky = false, // 是否固定列
  minWidth,
  ...props
}) => {
  // 构建响应式显示样式
  const getDisplayStyle = () => {
    if (hideOn.length === 0) return {};

    // Material-UI 响应式显示逻辑
    // hideOn: ['xs', 'sm'] 表示在 xs 和 sm 隐藏，在 md+ 显示
    const display = {};
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];

    breakpoints.forEach(breakpoint => {
      if (hideOn.includes(breakpoint)) {
        display[breakpoint] = 'none';
      } else {
        display[breakpoint] = 'table-cell';
      }
    });

    return { display };
  };

  return (
    <TableCell
      sx={{
        ...getDisplayStyle(),
        ...(minWidth && { minWidth })
        // 移除默认的sticky样式，让容器来控制
      }}
      className={sticky ? 'sticky-actions' : ''}
      {...props}
    >
      {children}
    </TableCell>
  );
};

export default ResponsiveTable;
