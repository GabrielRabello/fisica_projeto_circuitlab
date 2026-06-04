/**
 * Tipos específicos do editor visual (não pertencem ao domínio elétrico).
 */
import type { ComponentKind } from './circuit'

/**
 * Ferramenta ativa na barra de ferramentas.
 *
 * `select` manipula componentes existentes; as demais são ferramentas de
 * desenho e correspondem diretamente a um `ComponentKind`.
 */
export type Tool = 'select' | ComponentKind

/** Identifica qual terminal de um componente está sendo arrastado ao redimensionar. */
export type HandleId = 'a' | 'b'
