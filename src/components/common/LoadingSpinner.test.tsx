import { render, screen } from '@testing-library/react'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('デフォルト設定でレンダリングされる', () => {
    render(<LoadingSpinner />)
    // スピナー要素が存在することを確認
    const spinnerContainer = document.querySelector('.animate-spin')
    expect(spinnerContainer).toBeInTheDocument()
  })

  it('メッセージが表示される', () => {
    render(<LoadingSpinner message="読み込み中..." />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('サイズsmが適用される', () => {
    render(<LoadingSpinner size="sm" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-4', 'w-4')
  })

  it('サイズlgが適用される', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })

  it('fullScreenモードでレンダリングされる', () => {
    render(<LoadingSpinner fullScreen />)
    const container = document.querySelector('.min-h-screen.pt-8')
    expect(container).toBeInTheDocument()
  })

  it('withHeaderOffsetモードでレンダリングされる', () => {
    render(<LoadingSpinner withHeaderOffset />)
    const container = document.querySelector('.min-h-screen.pt-32')
    expect(container).toBeInTheDocument()
  })

  it('カスタムclassNameが適用される', () => {
    render(<LoadingSpinner className="custom-class" />)
    const container = document.querySelector('.custom-class')
    expect(container).toBeInTheDocument()
  })

  it('minHeightが適用される', () => {
    render(<LoadingSpinner minHeight="200px" />)
    const container = document.querySelector('.text-center')
    expect(container).toHaveStyle({ minHeight: '200px' })
  })
})
