import { pool } from '../config/database'

export async function getNextDocumentNumber(brandId: number, prefix: string): Promise<string> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute(
      'SELECT next_number FROM document_sequences WHERE brand_id = ? AND prefix = ? FOR UPDATE',
      [brandId, prefix]
    ) as any[]
    if (!rows.length) {
      await conn.execute(
        'INSERT INTO document_sequences (brand_id, prefix, next_number) VALUES (?, ?, 2)',
        [brandId, prefix]
      )
      await conn.commit()
      return `${prefix}/${String(1).padStart(3, '0')}`
    }
    const num = rows[0].next_number as number
    await conn.execute(
      'UPDATE document_sequences SET next_number = next_number + 1 WHERE brand_id = ? AND prefix = ?',
      [brandId, prefix]
    )
    await conn.commit()
    return `${prefix}/${String(num).padStart(3, '0')}`
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
