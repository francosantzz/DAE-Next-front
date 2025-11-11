'use client'

import * as React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type PaginatorProps = {
  page: number
  totalItems?: number
  pageSize?: number
  totalPages?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  siblingCount?: number
  disabled?: boolean
  className?: string
}

const DOTS = 'DOTS'

function usePaginationRange({
  currentPage,
  totalPages,
  siblingCount = 1,
}: { currentPage: number; totalPages: number; siblingCount?: number }) {
  return React.useMemo<(number | typeof DOTS)[]>(() => {
    const totalNumbers = siblingCount * 2 + 5
    if (totalNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSibling = Math.max(currentPage - siblingCount, 1)
    const rightSibling = Math.min(currentPage + siblingCount, totalPages)

    const showLeftDots = leftSibling > 2
    const showRightDots = rightSibling < totalPages - 1

    const firstPage = 1
    const lastPage = totalPages

    if (!showLeftDots && showRightDots) {
      const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1)
      return [...leftRange, DOTS, totalPages]
    }

    if (showLeftDots && !showRightDots) {
      const rightRange = Array.from(
        { length: 3 + siblingCount * 2 },
        (_, i) => totalPages - (3 + siblingCount * 2) + 1 + i
      )
      return [firstPage, DOTS, ...rightRange]
    }

    if (showLeftDots && showRightDots) {
      const middleRange = Array.from(
        { length: siblingCount * 2 + 1 },
        (_, i) => leftSibling + i
      )
      return [firstPage, DOTS, ...middleRange, DOTS, lastPage]
    }

    return []
  }, [currentPage, siblingCount, totalPages])
}

export function Paginator({
  page,
  totalItems,
  pageSize,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  siblingCount = 1,
  disabled = false,
  className,
}: PaginatorProps) {
  const computedTotalPages = React.useMemo(() => {
    if (typeof totalPagesProp === 'number') return Math.max(totalPagesProp, 1)
    if (typeof totalItems === 'number' && typeof pageSize === 'number' && pageSize > 0) {
      return Math.max(Math.ceil(totalItems / pageSize), 1)
    }
    return 1
  }, [totalPagesProp, totalItems, pageSize])

  const safePage = Math.min(Math.max(page, 1), computedTotalPages)
  const range = usePaginationRange({
    currentPage: safePage,
    totalPages: computedTotalPages,
    siblingCount,
  })

  const start = React.useMemo(() => {
    if (!totalItems || !pageSize) return null
    return (safePage - 1) * pageSize + 1
  }, [safePage, totalItems, pageSize])

  const end = React.useMemo(() => {
    if (!totalItems || !pageSize) return null
    return Math.min(safePage * pageSize, totalItems)
  }, [safePage, totalItems, pageSize])

  const goTo = (p: number) => {
    if (disabled) return
    const next = Math.min(Math.max(p, 1), computedTotalPages)
    if (next !== safePage) onPageChange(next)
  }

  return (
    <div className={`w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}>
      {/* Resumen */}
      <div className="text-sm text-muted-foreground flex gap-1">
        {typeof totalItems === 'number' && typeof pageSize === 'number' && start && end
          ? <>Mostrando <span className="font-medium">{start}</span>–<span className="font-medium">{end}</span> de <span className="font-medium">{totalItems}</span></>
          : <>Página <span className="font-medium">{safePage}</span> de <span className="font-medium">{computedTotalPages}</span></>
        }
      </div>

      {/* Selector de tamaño - solo desde md: */}
      {onPageSizeChange && typeof pageSize === 'number' && (
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map(opt => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Pagination>
        <PaginationContent className="justify-center sm:p-2">
          {/* Móvil: solo Anterior / Siguiente */}
          <PaginationItem className="sm:hidden">
            <PaginationPrevious
              href="#"
              aria-label="Página anterior"
              onClick={(e) => { e.preventDefault(); goTo(safePage - 1) }}
            />
          </PaginationItem>
          <PaginationItem className="sm:hidden">
            <PaginationNext
              href="#"
              aria-label="Página siguiente"
              onClick={(e) => { e.preventDefault(); goTo(safePage + 1) }}
            />
          </PaginationItem>

          {/* sm+: completo */}
          <PaginationItem className="hidden sm:flex">
            <PaginationLink
              href="#"
              onClick={(e) => { e.preventDefault(); goTo(1) }}
              aria-label="Primera página"
            >
              Primera 
            </PaginationLink>
          </PaginationItem>

          <PaginationItem className="hidden sm:flex">
            <PaginationPrevious
              href="#"
              aria-label="Página anterior"
              onClick={(e) => { e.preventDefault(); goTo(safePage - 1) }}
            />
          </PaginationItem>

          {range.map((item, idx) => {
            if (item === DOTS) {
              return (
                <PaginationItem key={`dots-${idx}`} className="hidden sm:flex" aria-hidden>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            }
            const pageNumber = item as number
            const isActive = pageNumber === safePage
            return (
              <PaginationItem key={pageNumber} className="hidden sm:flex">
                <PaginationLink
                  href="#"
                  aria-current={isActive ? 'page' : undefined}
                  isActive={isActive}
                  onClick={(e) => { e.preventDefault(); goTo(pageNumber) }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            )
          })}

          <PaginationItem className="hidden sm:flex">
            <PaginationNext
              href="#"
              aria-label="Página siguiente"
              onClick={(e) => { e.preventDefault(); goTo(safePage + 1) }}
            />
          </PaginationItem>

          <PaginationItem className="hidden sm:flex">
            <PaginationLink
              href="#"
              onClick={(e) => { e.preventDefault(); goTo(computedTotalPages) }}
              aria-label="Última página"
            >
              Última
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
