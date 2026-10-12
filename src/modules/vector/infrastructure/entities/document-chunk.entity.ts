import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'document_chunks', synchronize: false })
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_name', type: 'varchar', length: 255 })
  documentName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({
    type: 'text',
    transformer: {
      to: (value: number[] | string) =>
        Array.isArray(value) ? `[${value.join(',')}]` : value,
      from: (value: string | number[]) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map((v) => parseFloat(v.trim()))
          .filter((v) => !isNaN(v));
      },
    },
  })
  embedding: number[];
}
