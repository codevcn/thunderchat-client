import type { TDetectCollisionWithViewportEdgesResult } from "./types/global"

export class PageLayoutHelper {
  /**
   * Detects collision of a target element with the viewport edges. CSS Top, left are used for positioning. Use for fixed elements.
   * @param target The target element to check for collisions.
   * @param margin The margin to apply when repositioning the element.
   * @returns An object indicating which edge the element is colliding with, if any.
   */
  static detectFixedCollisionWithViewportEdges(
    target: HTMLElement,
    margin: number
  ): TDetectCollisionWithViewportEdgesResult {
    const targetRect = target.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const result: TDetectCollisionWithViewportEdgesResult = {
      edge: null,
    }
    if (targetRect.left < 0) {
      target.style.left = `${margin}px`
      result.edge = "left"
    }
    if (targetRect.right > viewportWidth) {
      target.style.left = `${viewportWidth - targetRect.width - margin}px`
      result.edge = "right"
    }
    if (targetRect.top < 0) {
      target.style.top = `${margin}px`
      result.edge = "top"
    }
    if (targetRect.bottom > viewportHeight) {
      target.style.top = `${viewportHeight - targetRect.height - margin}px`
      result.edge = "bottom"
    }
    return result
  }

  // static detectAbsoluteCollisionWithViewportEdges(
  //   targetContainer: HTMLElement,
  //   target: HTMLElement,
  //   margin: number
  // ): TDetectCollisionWithViewportEdgesResult {
  //   const containerRect = targetContainer.getBoundingClientRect()
  //   const targetRect = target.getBoundingClientRect()
  //   const result: TDetectCollisionWithViewportEdgesResult = {
  //     edge: null,
  //   }
  //   if (targetRect.top < 0) {
  //     target.style.top = `${containerRect.top - targetRect.height - margin}px`
  //   }
  //   if (targetRect.left < 0) {
  //     target.style.left = `${containerRect.left - targetRect.width - margin}px`
  //   }
  // }

  static detectRelativeCollisionWithViewportEdges(
    target: HTMLElement,
    margin: number
  ): TDetectCollisionWithViewportEdgesResult {
    return this.detectFixedCollisionWithViewportEdges(target, margin)
  }

  static detectCollisionWithViewportEdges(
    target: HTMLElement,
    margin: number,
    targetContainer?: HTMLElement
  ): TDetectCollisionWithViewportEdgesResult {
    const elementPosition = getComputedStyle(target).position
    if (elementPosition === "fixed") {
      return this.detectFixedCollisionWithViewportEdges(target, margin)
    } else if (elementPosition === "absolute" && targetContainer) {
      // return this.detectAbsoluteCollisionWithViewportEdges(targetContainer, target, margin)
    }
    return this.detectRelativeCollisionWithViewportEdges(target, margin)
  }
}
